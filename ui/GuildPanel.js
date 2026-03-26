export default class GuildPanel {
    constructor(scene) {
        this.scene = scene;
        this._el = null;
        this._visible = false;
    }

    _getGuild() {
        try { return JSON.parse(localStorage.getItem('ahc_my_guild') || 'null'); } catch { return null; }
    }
    _saveGuild(data) {
        try { localStorage.setItem('ahc_my_guild', JSON.stringify(data)); } catch {}
    }
    _getGuildIsland() {
        try { return JSON.parse(localStorage.getItem('ahc_guild_island') || 'null'); } catch { return null; }
    }

    _build() {
        const guild = this._getGuild();
        const islandData = this._getGuildIsland();

        const el = document.createElement('div');
        el.id = 'guild-panel';
        el.style.cssText = `
            position:fixed; inset:0; z-index:21000;
            display:flex; align-items:center; justify-content:center;
            background:rgba(0,0,0,0.8); font-family:Arial,sans-serif; padding:8px;
        `;

        const panel = document.createElement('div');
        panel.style.cssText = `
            width:100%; max-width:520px; max-height:88vh;
            background:linear-gradient(170deg,#0e1f34 0%,#070f1a 100%);
            border:2px solid #c79a52; border-radius:8px;
            display:flex; flex-direction:column; overflow:hidden;
            box-shadow:0 0 60px rgba(199,154,82,0.2);
        `;

        const colorOptions = ['#d4aa40','#ff4444','#4488ff','#44cc44','#cc44ff','#ff8844','#44ffee'];

        panel.innerHTML = `
            <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px 10px;border-bottom:1px solid rgba(199,154,82,0.3);">
                <div style="font-size:16px;font-weight:bold;color:#d4aa40;letter-spacing:2px;">⚓ GILDE</div>
                <button id="guild-close" style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.2);color:#fff;font-size:18px;width:32px;height:32px;border-radius:50%;cursor:pointer;padding:0;touch-action:manipulation;">✕</button>
            </div>
            <div style="flex:1;overflow-y:auto;padding:16px;-webkit-overflow-scrolling:touch;">
                ${guild ? this._renderGuildInfo(guild, islandData) : this._renderCreateForm(colorOptions)}
            </div>
        `;

        el.appendChild(panel);
        el.addEventListener('click', (e) => { if (e.target === el) this.hide(); });
        document.body.appendChild(el);
        this._el = el;

        setTimeout(() => {
            document.getElementById('guild-close')?.addEventListener('click', () => this.hide());
            if (!guild) this._wireCreateForm(colorOptions);
            else this._wireGuildActions(guild);
        }, 0);
    }

    _renderGuildInfo(guild, islandData) {
        const guildIslandOwner = islandData?.guild ?? 'Keine';
        const ownsIsland = islandData?.guild === guild.name;
        return `
            <div style="text-align:center;margin-bottom:20px;">
                <div style="font-size:36px;margin-bottom:8px;">${guild.emblem ?? '⚓'}</div>
                <div style="font-size:22px;font-weight:bold;color:${guild.color ?? '#d4aa40'};letter-spacing:2px;">[${guild.tag}] ${guild.name}</div>
                <div style="font-size:12px;color:#888;margin-top:4px;">Gegründet am ${new Date(guild.created).toLocaleDateString('de-DE')}</div>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px;">
                ${this._statCard('⚔', 'Schlachten', guild.battles ?? 0, '#ff6060')}
                ${this._statCard('💰', 'Gold erbeutet', (guild.totalGold ?? 0).toLocaleString(), '#ffd36a')}
                ${this._statCard('👥', 'Mitglieder', guild.members?.length ?? 1, '#8fd8ff')}
                ${this._statCard('⚑', 'Gildeninsel', ownsIsland ? '✓ Besessen' : guildIslandOwner, ownsIsland ? '#44ff88' : '#888')}
            </div>

            <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:14px;margin-bottom:14px;">
                <div style="font-size:13px;font-weight:bold;color:#d4aa40;margin-bottom:10px;">👥 Mitglieder</div>
                ${(guild.members ?? [guild.leader]).map(m => `
                    <div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
                        <div style="font-size:20px;">⚓</div>
                        <div style="flex:1;">
                            <div style="font-size:13px;color:#ddd;">${m}</div>
                            <div style="font-size:11px;color:#888;">${m === guild.leader ? '⭐ Gildenmeister' : 'Mitglied'}</div>
                        </div>
                    </div>
                `).join('')}
            </div>

            <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:14px;margin-bottom:14px;">
                <div style="font-size:13px;font-weight:bold;color:#d4aa40;margin-bottom:8px;">⚑ Gildeninsel</div>
                <div style="font-size:12px;color:#aaa;margin-bottom:8px;">
                    ${ownsIsland ? '🏆 Deine Gilde besitzt die Gildeninsel! +120 Gold alle 30 Sek.' : 'Greife die Türme auf der Gildeninsel an, um sie zu erobern!'}
                </div>
                ${ownsIsland ? '<div style="font-size:12px;color:#44ff88;">Bonus aktiv: +120 Gold / 30 Sek. ⚑</div>' : ''}
            </div>

            <div style="display:flex;gap:10px;">
                <button id="guild-add-member" style="flex:1;padding:10px;background:rgba(68,136,255,0.1);border:1px solid #4488ff;color:#8fd8ff;border-radius:6px;cursor:pointer;font-size:12px;touch-action:manipulation;">+ Mitglied einladen</button>
                <button id="guild-leave" style="flex:1;padding:10px;background:rgba(255,60,60,0.1);border:1px solid rgba(255,60,60,0.5);color:#ff8888;border-radius:6px;cursor:pointer;font-size:12px;touch-action:manipulation;">Gilde verlassen</button>
            </div>
        `;
    }

    _statCard(icon, label, value, color) {
        return `
            <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:6px;padding:12px;text-align:center;">
                <div style="font-size:20px;">${icon}</div>
                <div style="font-size:16px;font-weight:bold;color:${color};margin:4px 0;">${value}</div>
                <div style="font-size:10px;color:#888;">${label}</div>
            </div>
        `;
    }

    _renderCreateForm(colorOptions) {
        return `
            <div style="text-align:center;margin-bottom:20px;">
                <div style="font-size:28px;margin-bottom:8px;">⚓</div>
                <div style="font-size:18px;font-weight:bold;color:#d4aa40;">Gilde gründen</div>
                <div style="font-size:12px;color:#888;margin-top:4px;">Gründe eine Gilde, um die Gildeninsel zu erobern und Gold zu verdienen</div>
            </div>
            <div style="display:flex;flex-direction:column;gap:12px;max-width:400px;margin:0 auto;">
                <div>
                    <label style="font-size:12px;color:#888;display:block;margin-bottom:4px;">Gildenname (3–20 Zeichen)</label>
                    <input id="guild-name" type="text" placeholder="z.B. Die Schwarzen Segel" maxlength="20" style="width:100%;padding:10px;background:rgba(10,20,35,0.8);border:1px solid #7a6520;border-radius:4px;color:#ddd;font-size:14px;font-family:Arial;box-sizing:border-box;outline:none;caret-color:#d4aa40;" />
                </div>
                <div>
                    <label style="font-size:12px;color:#888;display:block;margin-bottom:4px;">Gilden-Tag (2–5 Zeichen, z.B. TBS)</label>
                    <input id="guild-tag" type="text" placeholder="TBS" maxlength="5" style="width:100%;padding:10px;background:rgba(10,20,35,0.8);border:1px solid #7a6520;border-radius:4px;color:#ddd;font-size:14px;font-family:Arial;box-sizing:border-box;outline:none;caret-color:#d4aa40;" />
                </div>
                <div>
                    <label style="font-size:12px;color:#888;display:block;margin-bottom:4px;">Gildenfarbe</label>
                    <div id="guild-color-row" style="display:flex;gap:8px;flex-wrap:wrap;">
                        ${colorOptions.map((c, i) => `
                            <div data-color="${c}" data-idx="${i}" style="width:32px;height:32px;border-radius:50%;background:${c};cursor:pointer;border:3px solid ${i === 0 ? '#fff' : 'transparent'};touch-action:manipulation;" title="${c}"></div>
                        `).join('')}
                    </div>
                </div>
                <div>
                    <label style="font-size:12px;color:#888;display:block;margin-bottom:4px;">Wappen-Emoji</label>
                    <div id="guild-emblem-row" style="display:flex;gap:8px;flex-wrap:wrap;">
                        ${['⚓','🏴‍☠️','⚔','🦅','🐉','👑','💀','🌊'].map((e, i) => `
                            <div data-emb="${e}" style="font-size:24px;cursor:pointer;padding:4px;border-radius:4px;background:${i===0?'rgba(212,170,64,0.2)':'transparent'};touch-action:manipulation;">${e}</div>
                        `).join('')}
                    </div>
                </div>
                <div id="guild-form-error" style="font-size:12px;color:#ff6060;min-height:16px;"></div>
                <button id="guild-create-btn" style="width:100%;padding:12px;background:linear-gradient(135deg,#1a3a1a,#0e260e);border:1px solid #4a8a4a;color:#b8ffb8;font-size:14px;border-radius:6px;cursor:pointer;font-family:Arial;font-weight:bold;touch-action:manipulation;">⚓ Gilde gründen</button>
            </div>
        `;
    }

    _wireCreateForm(colorOptions) {
        let selectedColor = colorOptions[0];
        let selectedEmblem = '⚓';

        document.getElementById('guild-color-row')?.addEventListener('click', (e) => {
            const div = e.target.closest('[data-color]');
            if (!div) return;
            selectedColor = div.dataset.color;
            document.querySelectorAll('#guild-color-row [data-color]').forEach(d => d.style.borderColor = 'transparent');
            div.style.borderColor = '#fff';
        });
        document.getElementById('guild-emblem-row')?.addEventListener('click', (e) => {
            const div = e.target.closest('[data-emb]');
            if (!div) return;
            selectedEmblem = div.dataset.emb;
            document.querySelectorAll('#guild-emblem-row [data-emb]').forEach(d => d.style.background = 'transparent');
            div.style.background = 'rgba(212,170,64,0.2)';
        });

        document.getElementById('guild-create-btn')?.addEventListener('click', () => {
            const name = document.getElementById('guild-name')?.value?.trim();
            const tag  = document.getElementById('guild-tag')?.value?.trim().toUpperCase();
            const errEl = document.getElementById('guild-form-error');
            if (!name || name.length < 3) { errEl.textContent = 'Gildenname: min. 3 Zeichen'; return; }
            if (!tag  || tag.length < 2)  { errEl.textContent = 'Gilden-Tag: min. 2 Zeichen';  return; }
            const leader = window._loginUsername ?? 'Kapitän';
            const guildData = { name, tag, color: selectedColor, emblem: selectedEmblem, leader, members: [leader], created: Date.now(), battles: 0, totalGold: 0 };
            this._saveGuild(guildData);
            if (this.scene?.player) {
                this.scene.player.guildName = name;
                this.scene.player.guildTag  = tag;
                this.scene.player.guildColor = selectedColor;
            }
            this.scene?.showStatusMsg?.(`⚓ Gilde "${name}" gegründet!`, 0xd4aa40);
            this.hide();
            this.show();
        });
    }

    _wireGuildActions(guild) {
        document.getElementById('guild-leave')?.addEventListener('click', () => {
            if (confirm(`Gilde "${guild.name}" wirklich verlassen?`)) {
                try { localStorage.removeItem('ahc_my_guild'); } catch {}
                if (this.scene?.player) { this.scene.player.guildName = null; this.scene.player.guildTag = null; }
                this.hide(); this.show();
            }
        });
        document.getElementById('guild-add-member')?.addEventListener('click', () => {
            const nm = prompt('Benutzername des neuen Mitglieds:');
            if (!nm) return;
            guild.members = guild.members ?? [guild.leader];
            if (!guild.members.includes(nm)) { guild.members.push(nm); this._saveGuild(guild); }
            this.hide(); this.show();
        });
    }

    show() {
        if (this._el) { this._el.remove(); this._el = null; }
        this._build();
        this._visible = true;
    }
    hide() {
        if (this._el) this._el.style.display = 'none';
        this._visible = false;
    }
    toggle() { if (this._visible) this.hide(); else this.show(); }
    isOpen() { return this._visible; }
    destroy() { if (this._el?.parentNode) this._el.parentNode.removeChild(this._el); this._el = null; }
}
