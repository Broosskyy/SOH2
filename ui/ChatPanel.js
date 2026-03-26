export default class ChatPanel {
    constructor(scene) {
        this.scene = scene;
        this._el = null;
        this._log = [];
        this._visible = false;
        this._build();
        this._bindHotkey();
    }

    _build() {
        const el = document.createElement('div');
        el.id = 'chat-panel';
        el.style.cssText = `
            position:fixed; bottom:60px; left:8px;
            width:320px; max-width:calc(100vw - 16px);
            z-index:18000; font-family:Arial,sans-serif;
            display:none; flex-direction:column; gap:4px;
            pointer-events:auto;
        `;

        const log = document.createElement('div');
        log.id = 'chat-log';
        log.style.cssText = `
            max-height:160px; overflow-y:auto;
            background:rgba(4,14,30,0.82); border:1px solid rgba(74,200,255,0.22);
            border-radius:6px; padding:6px 8px;
            display:flex; flex-direction:column; gap:2px;
            -webkit-overflow-scrolling:touch;
            scrollbar-width:none;
        `;
        this._logEl = log;

        const row = document.createElement('div');
        row.style.cssText = `display:flex;gap:4px;`;

        const input = document.createElement('input');
        input.id = 'chat-input';
        input.type = 'text';
        input.placeholder = '/hilfe für Befehle…';
        input.maxLength = 80;
        input.style.cssText = `
            flex:1; padding:7px 10px;
            background:rgba(4,14,30,0.92); border:1px solid rgba(74,200,255,0.35);
            border-radius:6px; color:#dff8ff; font-size:13px;
            outline:none; caret-color:#63d6ff; touch-action:manipulation;
        `;
        this._inputEl = input;

        const sendBtn = document.createElement('button');
        sendBtn.textContent = '▶';
        sendBtn.style.cssText = `
            padding:7px 12px; background:rgba(74,200,255,0.12);
            border:1px solid rgba(74,200,255,0.4); border-radius:6px;
            color:#63d6ff; font-size:14px; cursor:pointer;
            touch-action:manipulation; outline:none;
        `;

        input.addEventListener('keydown', (e) => {
            e.stopPropagation();
            if (e.key === 'Enter') { e.preventDefault(); this._submit(); }
            if (e.key === 'Escape') this.hide();
        });
        sendBtn.addEventListener('click', () => this._submit());
        sendBtn.addEventListener('touchend', (e) => { e.preventDefault(); this._submit(); }, { passive: false });

        row.appendChild(input);
        row.appendChild(sendBtn);
        el.appendChild(log);
        el.appendChild(row);
        document.body.appendChild(el);
        this._el = el;

        this._addSystemMsg('💬 Chat & Befehle aktiv. Tippe /hilfe für alle Kommandos.');
    }

    _bindHotkey() {
        this._keyHandler = (e) => {
            if (e.key === 'Enter' && !e.target.matches('input, textarea')) {
                this.toggle();
            }
        };
        window.addEventListener('keydown', this._keyHandler);
    }

    _submit() {
        const val = this._inputEl.value.trim();
        if (!val) return;
        this._inputEl.value = '';
        if (val.startsWith('/')) {
            this._handleCommand(val);
        } else {
            this._addMsg(`💬 Du`, val, '#dff8ff');
        }
    }

    _handleCommand(raw) {
        const parts = raw.slice(1).split(' ');
        const cmd = parts[0].toLowerCase();
        const arg = parts.slice(1).join(' ');
        const p = this.scene?.player;

        switch (cmd) {
            case 'hilfe':
            case 'help': {
                const cmds = [
                    '/gold <n>     — Gold hinzufügen',
                    '/gems <n>     — Edelsteine hinzufügen',
                    '/hp           — HP vollständig heilen',
                    '/2x           — 2× Belohnungen (60 Sek.)',
                    '/5x           — 5× Belohnungen (30 Sek.)',
                    '/event <id>   — Event starten (konvoi/geist/admiral)',
                    '/lvl <n>      — Level setzen',
                    '/speed <n>    — Schiffsgeschwindigkeit setzen',
                    '/clear        — Chat leeren',
                    '/spawn npc    — 5 neue NPCs spawnen',
                ];
                cmds.forEach(c => this._addSystemMsg(c));
                break;
            }
            case 'gold': {
                const n = parseInt(arg) || 500;
                if (p) { p.gold = (p.gold ?? 0) + n; this.scene.updateUIBars?.(); }
                this._addSystemMsg(`✅ +${n} Gold gutgeschrieben.`);
                this.scene?.showStatusMsg?.(`+${n} 🪙 Gold`, 0xffd36a);
                break;
            }
            case 'gems': {
                const n = parseInt(arg) || 10;
                if (p) { p.gems = (p.gems ?? 0) + n; this.scene.updateUIBars?.(); }
                this._addSystemMsg(`✅ +${n} 💎 Edelsteine gutgeschrieben.`);
                this.scene?.showStatusMsg?.(`+${n} 💎 Gems`, 0x88ffdd);
                break;
            }
            case 'hp': {
                if (p) { p.hp = p.maxHP; p.updateHealthBar?.(); this.scene.updateUIBars?.(); }
                this._addSystemMsg('✅ HP vollständig geheilt.');
                this.scene?.showStatusMsg?.('❤ HP vollständig geheilt', 0x44ff88);
                break;
            }
            case '2x': {
                this._setMultiplier(2, 60000);
                break;
            }
            case '5x': {
                this._setMultiplier(5, 30000);
                break;
            }
            case 'event': {
                const id = arg.toLowerCase().replace('geisterschiff','geisterschiff').replace('geist','geisterschiff').replace('admiral','admiralsjagd').replace('konvoi','konvoi') || 'konvoi';
                const validIds = { konvoi:'konvoi', geisterschiff:'geisterschiff', admiralsjagd:'admiralsjagd', geist:'geisterschiff', admiral:'admiralsjagd' };
                const evId = validIds[arg.toLowerCase()] ?? 'konvoi';
                this.scene?.startShipEvent?.(evId);
                this._addSystemMsg(`⚔ Event gestartet: ${evId}`);
                break;
            }
            case 'lvl':
            case 'level': {
                const n = Math.max(1, Math.min(100, parseInt(arg) || 1));
                if (p?.stats) {
                    p.stats.xp = p.stats.xpForLevel(n);
                    p.stats.level = n;
                    this.scene.updateUIBars?.();
                }
                this._addSystemMsg(`✅ Level auf ${n} gesetzt.`);
                this.scene?.showStatusMsg?.(`Level ${n}`, 0xffff44);
                break;
            }
            case 'speed': {
                const n = Math.max(1, Math.min(20, parseFloat(arg) || 8));
                if (p) { p.speed = n; }
                this._addSystemMsg(`✅ Geschwindigkeit auf ${n} gesetzt.`);
                break;
            }
            case 'spawn': {
                if (arg === 'npc') {
                    for (let i = 0; i < 5; i++) {
                        try { this.scene?.spawnNPCNear?.(p?.x ?? 2100, p?.y ?? 2100); } catch {}
                    }
                    this._addSystemMsg('✅ 5 NPCs gespawnt.');
                }
                break;
            }
            case 'clear': {
                if (this._logEl) this._logEl.innerHTML = '';
                this._log = [];
                break;
            }
            default:
                this._addSystemMsg(`❓ Unbekannter Befehl: /${cmd}. Tippe /hilfe.`);
        }
    }

    _setMultiplier(factor, durationMs) {
        const p = this.scene?.player;
        if (!p) return;
        p.rewardMultiplier = factor;
        const secs = Math.round(durationMs / 1000);
        this._addSystemMsg(`⚡ ${factor}× Belohnungs-Multiplikator aktiv für ${secs} Sek.!`);
        this.scene?.showStatusMsg?.(`⚡ ${factor}× MULTIPLIKATOR aktiv!`, 0xffd700);
        clearTimeout(this._multTimer);
        this._multTimer = setTimeout(() => {
            if (p) p.rewardMultiplier = 1;
            this._addSystemMsg('Multiplikator abgelaufen (zurück auf 1×).');
            this.scene?.showStatusMsg?.('Multiplikator abgelaufen', 0x888888);
        }, durationMs);

        this._updateMultiplierBadge(factor);
        setTimeout(() => this._removeMultiplierBadge(), durationMs);
    }

    _updateMultiplierBadge(factor) {
        let badge = document.getElementById('multiplier-badge');
        if (!badge) {
            badge = document.createElement('div');
            badge.id = 'multiplier-badge';
            badge.style.cssText = `
                position:fixed; top:60px; right:220px; z-index:19500;
                background:linear-gradient(135deg,#7f3f00,#ff8800);
                border:2px solid #ffd36a; border-radius:20px;
                padding:4px 12px; font-family:Arial,sans-serif;
                font-size:13px; font-weight:bold; color:#fff;
                box-shadow:0 0 16px #ff880088;
                animation:multPulse 0.8s ease-in-out infinite alternate;
                pointer-events:none;
            `;
            if (!document.getElementById('mult-style')) {
                const s = document.createElement('style');
                s.id = 'mult-style';
                s.textContent = '@keyframes multPulse{from{box-shadow:0 0 10px #ff880066}to{box-shadow:0 0 24px #ffd36aaa}}';
                document.head.appendChild(s);
            }
            document.body.appendChild(badge);
        }
        badge.textContent = `⚡ ×${factor} BONUS`;
    }

    _removeMultiplierBadge() {
        document.getElementById('multiplier-badge')?.remove();
    }

    _addMsg(label, text, color = '#dff8ff') {
        this._log.push({ label, text, color });
        if (this._log.length > 60) this._log.shift();
        const line = document.createElement('div');
        line.style.cssText = `font-size:11px; line-height:1.4; color:${color};`;
        line.innerHTML = `<span style="color:#9fdcff;margin-right:4px;">${label}</span>${this._esc(text)}`;
        this._logEl?.appendChild(line);
        this._logEl?.scrollTo(0, 99999);
    }

    _addSystemMsg(text) {
        this._addMsg('⚙', text, '#8fd8ff');
    }

    _esc(s) {
        return String(s).replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }

    show() {
        if (this._el) { this._el.style.display = 'flex'; this._visible = true; }
        setTimeout(() => this._inputEl?.focus(), 50);
    }

    hide() {
        if (this._el) { this._el.style.display = 'none'; this._visible = false; }
        this._inputEl?.blur();
    }

    toggle() {
        if (this._visible) this.hide(); else this.show();
    }

    isOpen() { return this._visible; }

    destroy() {
        window.removeEventListener('keydown', this._keyHandler);
        clearTimeout(this._multTimer);
        this._removeMultiplierBadge();
        this._el?.parentNode?.removeChild(this._el);
        this._el = null;
    }
}
