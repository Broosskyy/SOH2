export default class AdminPanel {
    constructor(scene) {
        this.scene = scene;
        this._el = null;
        this._visible = false;
        this._godMode = false;
        this._invincible = false;
    }

    _build() {
        const el = document.createElement('div');
        el.id = 'admin-panel';
        el.style.cssText = `
            position:fixed; inset:0; z-index:30000;
            display:flex; align-items:center; justify-content:center;
            background:rgba(0,0,0,0.88); font-family:Arial,sans-serif; padding:8px;
        `;
        const panel = document.createElement('div');
        panel.style.cssText = `
            width:100%; max-width:600px; max-height:92vh;
            background:linear-gradient(170deg,#0a0018 0%,#050010 100%);
            border:2px solid #aa44ff; border-radius:8px;
            display:flex; flex-direction:column; overflow:hidden;
            box-shadow:0 0 60px rgba(170,68,255,0.4);
        `;
        panel.innerHTML = `
            <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid rgba(170,68,255,0.35);flex-shrink:0;">
                <div style="font-size:15px;font-weight:bold;color:#cc88ff;letter-spacing:2px;">🛡 ADMIN · GAME MASTER</div>
                <button id="admin-close" style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.2);color:#fff;font-size:18px;width:32px;height:32px;border-radius:50%;cursor:pointer;padding:0;touch-action:manipulation;">✕</button>
            </div>
            <div style="flex:1;overflow-y:auto;padding:14px;-webkit-overflow-scrolling:touch;display:flex;flex-direction:column;gap:14px;">
                ${this._sectionPlayerStats()}
                ${this._sectionSpawn()}
                ${this._sectionModifiers()}
                ${this._sectionWorld()}
                ${this._sectionBroadcast()}
            </div>
        `;
        el.appendChild(panel);
        el.addEventListener('click', (e) => { if (e.target === el) this.hide(); });
        document.body.appendChild(el);
        this._el = el;
        setTimeout(() => this._wire(), 0);
    }

    _section(title, color, content) {
        return `
        <div style="background:rgba(255,255,255,0.03);border:1px solid ${color}33;border-radius:8px;padding:12px;">
            <div style="font-size:11px;font-weight:bold;color:${color};letter-spacing:2px;margin-bottom:10px;text-transform:uppercase;">${title}</div>
            ${content}
        </div>`;
    }

    _btn(id, label, color = '#aa44ff') {
        return `<button id="${id}" style="padding:7px 14px;background:rgba(${this._hex2rgb(color)},0.12);border:1px solid ${color};color:${color};border-radius:6px;cursor:pointer;font-size:12px;touch-action:manipulation;font-family:Arial;">${label}</button>`;
    }

    _hex2rgb(hex) {
        const h = hex.replace('#','');
        return `${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)}`;
    }

    _input(id, placeholder, value='', width='80px') {
        return `<input id="${id}" type="text" placeholder="${placeholder}" value="${value}" style="width:${width};padding:5px 8px;background:rgba(10,0,24,0.8);border:1px solid rgba(170,68,255,0.4);border-radius:4px;color:#ddd;font-size:12px;font-family:Arial;outline:none;" />`;
    }

    _sectionPlayerStats() {
        return this._section('⚔ Spieler-Stats', '#cc88ff', `
            <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;">
                ${this._input('adm-gold','Gold','1000','90px')} ${this._btn('adm-set-gold','+ Gold setzen','#ffd36a')}
                ${this._input('adm-gems','Gems','10','70px')} ${this._btn('adm-set-gems','+ Gems setzen','#88ffdd')}
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:8px;">
                ${this._input('adm-xp','XP','5000','90px')} ${this._btn('adm-set-xp','+ XP setzen','#8fd8ff')}
                ${this._input('adm-lvl','Level','10','70px')} ${this._btn('adm-set-lvl','Level setzen','#ffaa44')}
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:8px;">
                ${this._input('adm-hp','HP (%)','100','70px')} ${this._btn('adm-set-hp','HP setzen','#44ff88')}
                ${this._input('adm-speed','Speed','8','70px')} ${this._btn('adm-set-speed','Speed setzen','#9bf6ff')}
                ${this._btn('adm-full-heal','❤ Vollheilung','#44ff88')}
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px;">
                ${this._input('adm-mats','Materialien','50','90px')} ${this._btn('adm-set-mats','+ Mats setzen','#c8a060')}
                ${this._btn('adm-max-ammo','🔫 Munition max','#cc88ff')}
                ${this._btn('adm-unlock-all-ammo','🔓 Alle Munition','#cc88ff')}
            </div>
        `);
    }

    _sectionSpawn() {
        return this._section('🌊 Spawn & Teleport', '#4488ff', `
            <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;">
                ${this._input('adm-tp-x','X','2100','70px')} ${this._input('adm-tp-y','Y','2100','70px')}
                ${this._btn('adm-teleport','⌖ Teleport','#4488ff')}
                ${this._btn('adm-tp-center','Zentrum','#4488ff')}
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px;">
                ${this._input('adm-spawn-n','Anzahl','5','60px')}
                ${this._btn('adm-spawn-npc','+ NPC spawnen','#ff6060')}
                ${this._btn('adm-spawn-monster','+ Monster spawnen','#bf7bff')}
                ${this._btn('adm-spawn-gift','+ Schatztruhe','#ffd36a')}
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px;">
                ${this._btn('adm-spawn-event-konvoi','⚓ Konvoi-Event','#d4aa40')}
                ${this._btn('adm-spawn-event-geist','👻 Geister-Event','#88aaff')}
                ${this._btn('adm-spawn-event-admiral','👑 Admiral-Event','#ff8844')}
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px;">
                ${this._btn('adm-kill-all-npc','💀 Alle NPCs töten','#ff4444')}
                ${this._btn('adm-kill-all-monster','💀 Alle Monster töten','#bf7bff')}
                ${this._btn('adm-spawn-guild-island','⚑ Guild Island','#d4aa40')}
            </div>
        `);
    }

    _sectionModifiers() {
        return this._section('⚡ Modifikatoren', '#ff8844', `
            <div style="display:flex;flex-wrap:wrap;gap:8px;">
                <button id="adm-godmode" style="padding:7px 14px;background:${this._godMode?'rgba(255,136,68,0.3)':'rgba(255,136,68,0.1)'};border:1px solid #ff8844;color:#ff8844;border-radius:6px;cursor:pointer;font-size:12px;touch-action:manipulation;font-family:Arial;">🛡 Gottmodus ${this._godMode?'AN':'AUS'}</button>
                <button id="adm-invincible" style="padding:7px 14px;background:${this._invincible?'rgba(68,255,136,0.3)':'rgba(68,255,136,0.1)'};border:1px solid #44ff88;color:#44ff88;border-radius:6px;cursor:pointer;font-size:12px;touch-action:manipulation;font-family:Arial;">⚔ Unverwundbar ${this._invincible?'AN':'AUS'}</button>
                ${this._btn('adm-2x','⚡ 2× Belohnungen','#ffd36a')}
                ${this._btn('adm-5x','⚡ 5× Belohnungen','#ff8800')}
                ${this._btn('adm-1x','Reset ×1','#888888')}
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px;">
                ${this._btn('adm-unlock-blueprints','📜 Alle Designs','#7fffb0')}
                ${this._btn('adm-max-upgrades','⬆ Max Upgrades','#cc88ff')}
                ${this._btn('adm-reset-upgrades','↺ Reset Upgrades','#888888')}
            </div>
        `);
    }

    _sectionWorld() {
        return this._section('🗺 Welt & Kamera', '#9bf6ff', `
            <div style="display:flex;flex-wrap:wrap;gap:8px;">
                ${this._btn('adm-cam-zoom-in','🔍 Zoom In','#9bf6ff')}
                ${this._btn('adm-cam-zoom-out','🔍 Zoom Out','#9bf6ff')}
                ${this._btn('adm-cam-reset','Zoom Reset','#9bf6ff')}
                ${this._btn('adm-cam-center','📍 Auf Spieler','#9bf6ff')}
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px;">
                ${this._btn('adm-reveal-map','🗺 Karte enthüllen','#ffd36a')}
                ${this._btn('adm-day','☀ Tag','#ffd36a')}
                ${this._btn('adm-night','🌙 Nacht','#4488ff')}
                ${this._btn('adm-storm','⛈ Sturm','#8888ff')}
            </div>
        `);
    }

    _sectionBroadcast() {
        return this._section('📢 Broadcast', '#ff6060', `
            <div style="display:flex;gap:8px;align-items:center;">
                ${this._input('adm-bcast-msg','Nachricht an alle Spieler...','','100%')}
                ${this._btn('adm-bcast-send','Senden','#ff6060')}
            </div>
            <div id="adm-status" style="margin-top:8px;font-size:11px;color:#888;min-height:16px;"></div>
        `);
    }

    _log(msg, color='#cc88ff') {
        const el = document.getElementById('adm-status');
        if (el) { el.style.color = color; el.textContent = msg; }
    }

    _wire() {
        const s = this.scene;
        const p = () => s?.player;

        document.getElementById('admin-close')?.addEventListener('click', () => this.hide());

        const setBtnHandler = (id, fn) => {
            const el = document.getElementById(id);
            el?.addEventListener('click', fn);
            el?.addEventListener('touchend', (e) => { e.preventDefault(); fn(); }, { passive: false });
        };

        setBtnHandler('adm-set-gold', () => {
            const n = parseInt(document.getElementById('adm-gold')?.value) || 1000;
            if (p()) { p().gold = (p().gold ?? 0) + n; s.updateUIBars?.(); }
            this._log(`+${n} Gold gutgeschrieben`, '#ffd36a');
            s?.showStatusMsg?.(`+${n} 🪙`, 0xffd36a);
        });
        setBtnHandler('adm-set-gems', () => {
            const n = parseInt(document.getElementById('adm-gems')?.value) || 10;
            if (p()) { p().gems = (p().gems ?? 0) + n; s.updateUIBars?.(); }
            this._log(`+${n} Gems gutgeschrieben`, '#88ffdd');
        });
        setBtnHandler('adm-set-xp', () => {
            const n = parseInt(document.getElementById('adm-xp')?.value) || 5000;
            if (p()) { p().addXP?.(n); s.updateUIBars?.(); }
            this._log(`+${n} XP`, '#8fd8ff');
            s?.showStatusMsg?.(`+${n} XP`, 0x8fd8ff);
        });
        setBtnHandler('adm-set-lvl', () => {
            const n = Math.max(1, Math.min(100, parseInt(document.getElementById('adm-lvl')?.value) || 10));
            if (p()?.stats) { p().stats.level = n; p().level = n; s.updateUIBars?.(); }
            this._log(`Level auf ${n} gesetzt`, '#ffaa44');
            s?.showStatusMsg?.(`Level ${n}`, 0xffaa44);
        });
        setBtnHandler('adm-set-hp', () => {
            const pct = Math.max(0, Math.min(100, parseInt(document.getElementById('adm-hp')?.value) || 100)) / 100;
            if (p()) { p().hp = Math.round(p().maxHP * pct); p().updateHealthBar?.(); s.updateUIBars?.(); }
            this._log('HP gesetzt', '#44ff88');
        });
        setBtnHandler('adm-set-speed', () => {
            const n = Math.max(1, Math.min(30, parseFloat(document.getElementById('adm-speed')?.value) || 8));
            if (p()) p().speed = n;
            this._log(`Speed: ${n}`, '#9bf6ff');
        });
        setBtnHandler('adm-full-heal', () => {
            if (p()) { p().hp = p().maxHP; p().updateHealthBar?.(); s.updateUIBars?.(); }
            this._log('Vollheilung', '#44ff88');
            s?.showStatusMsg?.('❤ Vollheilung', 0x44ff88);
        });
        setBtnHandler('adm-set-mats', () => {
            const n = parseInt(document.getElementById('adm-mats')?.value) || 50;
            if (p()) { p().materials = (p().materials ?? 0) + n; s.updateUIBars?.(); }
            this._log(`+${n} Materialien`, '#c8a060');
        });
        setBtnHandler('adm-max-ammo', () => {
            if (p()) {
                ['flare','fire','storm','chainshot','grapeshot'].forEach(k => {
                    p().ammoInventory[k] = 999;
                });
            }
            this._log('Alle Munition auf 999 gesetzt', '#cc88ff');
            s?.showStatusMsg?.('🔫 Munition MAX', 0xcc88ff);
        });
        setBtnHandler('adm-unlock-all-ammo', () => {
            if (p()) {
                p().specialAmmoUnlocks = { chainshot: true, grapeshot: true };
                ['chainshot','grapeshot'].forEach(k => p().ammoInventory[k] = 999);
            }
            this._log('Alle Munitions-Typen freigeschaltet', '#cc88ff');
        });

        setBtnHandler('adm-teleport', () => {
            const x = parseInt(document.getElementById('adm-tp-x')?.value) || 2100;
            const y = parseInt(document.getElementById('adm-tp-y')?.value) || 2100;
            if (p()) { p().setPosition(x, y); s?.cameras?.main?.centerOn?.(x, y); }
            this._log(`Teleport → (${x}, ${y})`, '#4488ff');
        });
        setBtnHandler('adm-tp-center', () => {
            const cx = (s?.mapWidth ?? 4200) / 2, cy = (s?.mapHeight ?? 4200) / 2;
            if (p()) { p().setPosition(cx, cy); s?.cameras?.main?.centerOn?.(cx, cy); }
            this._log('Teleport → Zentrum', '#4488ff');
        });

        setBtnHandler('adm-spawn-npc', () => {
            const n = parseInt(document.getElementById('adm-spawn-n')?.value) || 5;
            for (let i = 0; i < n; i++) try { s?.spawnNPCNear?.(p()?.x ?? 2100, p()?.y ?? 2100); } catch {}
            this._log(`${n} NPCs gespawnt`, '#ff6060');
        });
        setBtnHandler('adm-spawn-monster', () => {
            const n = parseInt(document.getElementById('adm-spawn-n')?.value) || 3;
            for (let i = 0; i < n; i++) try { s?.spawnMonsterNear?.(p()?.x ?? 2100, p()?.y ?? 2100); } catch {}
            this._log(`${n} Monster gespawnt`, '#bf7bff');
        });
        setBtnHandler('adm-spawn-gift', () => {
            const n = parseInt(document.getElementById('adm-spawn-n')?.value) || 3;
            for (let i = 0; i < n; i++) try { s?.spawnGift?.(); } catch {}
            this._log(`${n} Schatztruhen gespawnt`, '#ffd36a');
        });

        ['konvoi','geisterschiff','admiralsjagd'].forEach(evId => {
            const shortId = { konvoi:'konvoi', geisterschiff:'geist', admiralsjagd:'admiral' }[evId];
            setBtnHandler(`adm-spawn-event-${shortId}`, () => {
                try { s?.startShipEvent?.(evId); } catch {}
                this._log(`Event gestartet: ${evId}`, '#d4aa40');
            });
        });

        setBtnHandler('adm-kill-all-npc', () => {
            s?.npcGroup?.getChildren?.()?.forEach?.(npc => { try { npc.destroy?.(); } catch {} });
            this._log('Alle NPCs getötet', '#ff4444');
        });
        setBtnHandler('adm-kill-all-monster', () => {
            s?.monsterGroup?.getChildren?.()?.forEach?.(m => { try { m.destroy?.(); } catch {} });
            this._log('Alle Monster getötet', '#bf7bff');
        });
        setBtnHandler('adm-spawn-guild-island', () => {
            try { s?.spawnGuildIsland?.(); } catch {}
            this._log('Gildeninsel gespawnt', '#d4aa40');
        });

        setBtnHandler('adm-godmode', () => {
            this._godMode = !this._godMode;
            if (p()) p()._godMode = this._godMode;
            s?.showStatusMsg?.(this._godMode ? '🛡 Gottmodus AKTIV' : '🛡 Gottmodus AUS', this._godMode ? 0xaa44ff : 0x888888);
            this._log(`Gottmodus: ${this._godMode ? 'AN' : 'AUS'}`, '#ff8844');
            this.hide(); this.show();
        });
        setBtnHandler('adm-invincible', () => {
            this._invincible = !this._invincible;
            if (p()) p()._invincible = this._invincible;
            s?.showStatusMsg?.(this._invincible ? '⚔ Unverwundbar AKTIV' : '⚔ Unverwundbar AUS', this._invincible ? 0x44ff88 : 0x888888);
            this._log(`Unverwundbar: ${this._invincible ? 'AN' : 'AUS'}`, '#44ff88');
            this.hide(); this.show();
        });

        setBtnHandler('adm-2x', () => {
            if (p()) p().rewardMultiplier = 2;
            s?.domChatPanel?._updateMultiplierBadge?.(2);
            this._log('2× Belohnungen aktiv', '#ffd36a');
        });
        setBtnHandler('adm-5x', () => {
            if (p()) p().rewardMultiplier = 5;
            s?.domChatPanel?._updateMultiplierBadge?.(5);
            this._log('5× Belohnungen aktiv', '#ff8800');
        });
        setBtnHandler('adm-1x', () => {
            if (p()) p().rewardMultiplier = 1;
            s?.domChatPanel?._removeMultiplierBadge?.();
            this._log('Multiplikator zurückgesetzt', '#888888');
        });

        setBtnHandler('adm-unlock-blueprints', () => {
            try {
                localStorage.setItem('ahc_ship_blueprints', JSON.stringify(['konvoi','geisterschiff','admiralsjagd']));
            } catch {}
            this._log('Alle Designs freigeschaltet', '#7fffb0');
            s?.showStatusMsg?.('📜 Alle Designs freigeschaltet!', 0x7fffb0);
        });
        setBtnHandler('adm-max-upgrades', () => {
            if (p()) {
                ['hullLevel','sailLevel','cannonLevel','cannonSlotLevel','deckLevel','ammoTechLevel'].forEach(k => { p()[k] = 10; });
                p().updateDerivedStats?.(p().ammoMultiplier ?? 1);
                s.updateUIBars?.();
            }
            this._log('Alle Upgrades auf MAX', '#cc88ff');
        });
        setBtnHandler('adm-reset-upgrades', () => {
            if (p()) {
                ['hullLevel','sailLevel','cannonLevel','cannonSlotLevel','deckLevel','ammoTechLevel'].forEach(k => { p()[k] = 1; });
                p().updateDerivedStats?.(1);
                s.updateUIBars?.();
            }
            this._log('Alle Upgrades zurückgesetzt', '#888888');
        });

        setBtnHandler('adm-cam-zoom-in', () => { s?.cameras?.main?.setZoom?.((s.cameras.main.zoom ?? 1) + 0.2); });
        setBtnHandler('adm-cam-zoom-out', () => { s?.cameras?.main?.setZoom?.(Math.max(0.2, (s.cameras.main.zoom ?? 1) - 0.2)); });
        setBtnHandler('adm-cam-reset', () => { s?.cameras?.main?.setZoom?.(1); });
        setBtnHandler('adm-cam-center', () => { if (p()) s?.cameras?.main?.centerOn?.(p().x, p().y); });

        setBtnHandler('adm-reveal-map', () => {
            this._log('Karte enthüllt (alle Seekarten freigeschaltet)', '#ffd36a');
            try { localStorage.setItem('ahc_map_unlocked', JSON.stringify([1,2,3,4,5,6,7,8])); } catch {}
            s?.showStatusMsg?.('🗺 Alle Seekarten freigeschaltet!', 0xffd36a);
        });
        setBtnHandler('adm-day', () => {
            document.getElementById('game-overlay')?.remove();
            this._log('Tag-Modus', '#ffd36a');
        });
        setBtnHandler('adm-night', () => {
            let ov = document.getElementById('game-overlay');
            if (!ov) {
                ov = document.createElement('div');
                ov.id = 'game-overlay';
                ov.style.cssText = `position:fixed;inset:0;z-index:1;pointer-events:none;`;
                document.body.appendChild(ov);
            }
            ov.style.background = 'rgba(0,10,40,0.45)';
            this._log('Nacht-Modus', '#4488ff');
        });
        setBtnHandler('adm-storm', () => {
            let ov = document.getElementById('game-overlay');
            if (!ov) {
                ov = document.createElement('div');
                ov.id = 'game-overlay';
                ov.style.cssText = `position:fixed;inset:0;z-index:1;pointer-events:none;`;
                document.body.appendChild(ov);
            }
            ov.style.background = 'rgba(30,30,80,0.35)';
            this._log('Sturm-Modus', '#8888ff');
        });

        setBtnHandler('adm-bcast-send', () => {
            const msg = document.getElementById('adm-bcast-msg')?.value?.trim();
            if (!msg) return;
            try {
                const bc = new BroadcastChannel('ahc-multiplayer');
                bc.postMessage({ type: 'gm-broadcast', msg, from: 'GM' });
                bc.close();
            } catch {}
            s?.showStatusMsg?.(`📢 GM: ${msg}`, 0xcc88ff);
            this._log(`Broadcast gesendet: "${msg}"`, '#cc88ff');
        });
    }

    show() {
        if (this._el) { this._el.remove(); this._el = null; }
        this._build();
        this._visible = true;
    }
    hide() {
        if (this._el) { this._el.style.display = 'none'; }
        this._visible = false;
    }
    toggle() { if (this._visible) this.hide(); else this.show(); }
    isOpen() { return this._visible; }
    destroy() { this._el?.parentNode?.removeChild(this._el); this._el = null; }
}
