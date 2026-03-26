const TIERS = [
    {
        id: 0, name: 'Einfach', icon: '🔩', color: '#aaaaaa', border: 'rgba(160,160,160,0.5)',
        bg: 'rgba(30,30,30,0.95)',
        dmgMult: 1.00, reloadMult: 1.00, rangeMult: 1.00,
        desc: 'Standardausstattung. Keine Boni.',
        cost: 0
    },
    {
        id: 1, name: 'Gut', icon: '⚙️', color: '#63d6ff', border: 'rgba(99,214,255,0.55)',
        bg: 'rgba(8,30,55,0.97)',
        dmgMult: 1.15, reloadMult: 0.95, rangeMult: 1.05,
        desc: '+15% Schaden · −5% Ladezeit · +5% Reichweite',
        cost: 800
    },
    {
        id: 2, name: 'Stark', icon: '⚔️', color: '#8bffba', border: 'rgba(139,255,186,0.55)',
        bg: 'rgba(5,28,18,0.97)',
        dmgMult: 1.35, reloadMult: 0.88, rangeMult: 1.12,
        desc: '+35% Schaden · −12% Ladezeit · +12% Reichweite',
        cost: 2500
    },
    {
        id: 3, name: 'Episch', icon: '🔥', color: '#ff9a5a', border: 'rgba(255,154,90,0.65)',
        bg: 'rgba(40,15,5,0.97)',
        dmgMult: 1.65, reloadMult: 0.78, rangeMult: 1.22,
        desc: '+65% Schaden · −22% Ladezeit · +22% Reichweite · Brandspur',
        cost: 6000
    },
    {
        id: 4, name: 'Legendär', icon: '👑', color: '#ffd700', border: 'rgba(255,215,0,0.75)',
        bg: 'rgba(30,20,0,0.98)',
        dmgMult: 2.10, reloadMult: 0.65, rangeMult: 1.38,
        desc: '+110% Schaden · −35% Ladezeit · +38% Reichweite · Goldene Kugeln',
        cost: 15000
    }
];

const SAVE_KEY = () => `ahc_cannon_tier_${window._loginUsername ?? 'guest'}`;

export default class CannonUpgradePanel {
    constructor(scene) {
        this.scene   = scene;
        this.visible = false;
        this._el     = null;
        this._build();
        this._loadTier();
    }

    _loadTier() {
        try {
            const saved = parseInt(localStorage.getItem(SAVE_KEY()) ?? '0', 10);
            this.scene.playerCannonTier = Math.min(4, Math.max(0, saved || 0));
        } catch { this.scene.playerCannonTier = 0; }
    }

    _saveTier(tier) {
        try { localStorage.setItem(SAVE_KEY(), String(tier)); } catch {}
        this.scene.playerCannonTier = tier;
    }

    _build() {
        const el = document.createElement('div');
        el.id = 'cannon-upgrade-panel';
        el.style.cssText = `
            position:fixed;top:52px;left:50%;transform:translateX(-50%);
            width:min(460px,97vw);z-index:13000;
            display:none;flex-direction:column;
            background:linear-gradient(180deg,rgba(12,22,44,0.98),rgba(6,12,28,0.98));
            border:2px solid rgba(212,175,55,0.55);border-radius:16px;
            box-shadow:0 8px 40px rgba(0,0,0,0.8),0 0 30px rgba(212,175,55,0.12);
            font-family:Arial,sans-serif;overflow:hidden;
        `;

        /* Header */
        const hdr = document.createElement('div');
        hdr.style.cssText = `
            display:flex;align-items:center;justify-content:space-between;
            padding:12px 16px 10px;
            background:linear-gradient(135deg,rgba(20,10,2,0.9),rgba(40,25,5,0.9));
            border-bottom:1px solid rgba(212,175,55,0.3);
        `;
        hdr.innerHTML = `
            <div style="display:flex;align-items:center;gap:10px;">
                <span style="font-size:22px;">💣</span>
                <div>
                    <div style="font-size:14px;font-weight:bold;color:#ffd36a;letter-spacing:1px;">KANONEN-KLASSE</div>
                    <div style="font-size:9px;color:#9fdcff;margin-top:1px;">Rüste deine Kanonen von Einfach bis Legendär auf</div>
                </div>
            </div>
            <button id="cannon-panel-close" style="
                background:none;border:none;color:#888;font-size:20px;cursor:pointer;
                line-height:1;padding:2px 6px;border-radius:4px;
            ">✕</button>
        `;
        el.appendChild(hdr);

        /* Tier cards */
        const body = document.createElement('div');
        body.id = 'cannon-tier-body';
        body.style.cssText = 'padding:10px 12px 14px;display:flex;flex-direction:column;gap:8px;overflow-y:auto;max-height:72vh;';

        TIERS.forEach(tier => {
            const card = document.createElement('div');
            card.id = `cannon-tier-card-${tier.id}`;
            card.style.cssText = `
                background:${tier.bg};
                border:2px solid ${tier.border};
                border-radius:12px;padding:10px 14px;
                display:flex;align-items:center;gap:12px;
                transition:box-shadow 0.2s;
            `;
            card.innerHTML = `
                <span style="font-size:26px;flex-shrink:0;">${tier.icon}</span>
                <div style="flex:1;min-width:0;">
                    <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                        <span style="font-size:13px;font-weight:bold;color:${tier.color};">${tier.name}</span>
                        <span id="cannon-tier-badge-${tier.id}" style="
                            font-size:8px;font-weight:bold;padding:2px 6px;border-radius:4px;
                            background:rgba(212,175,55,0.15);border:1px solid rgba(212,175,55,0.4);
                            color:#ffd36a;display:none;
                        ">AKTIV</span>
                    </div>
                    <div style="font-size:9px;color:#9fdcff;margin:3px 0;">${tier.desc}</div>
                    ${tier.cost > 0
                        ? `<div style="font-size:9px;color:#c8a060;">Kosten: ${tier.cost.toLocaleString('de-DE')} Gold</div>`
                        : `<div style="font-size:9px;color:#aaa;">Basis-Ausstattung</div>`}
                </div>
                ${tier.id > 0
                    ? `<button id="cannon-tier-btn-${tier.id}" style="
                        padding:6px 12px;border-radius:8px;font-size:11px;font-weight:bold;
                        border:1.5px solid ${tier.border};
                        background:rgba(0,0,0,0.4);color:${tier.color};
                        cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent;
                        white-space:nowrap;flex-shrink:0;
                        transition:background 0.15s;
                    ">Aufwerten</button>`
                    : ''
                }
            `;
            body.appendChild(card);
        });

        el.appendChild(body);
        document.body.appendChild(el);
        this._el = el;

        /* Events */
        document.getElementById('cannon-panel-close')?.addEventListener('click', () => this.hide());

        TIERS.forEach(tier => {
            if (tier.id === 0) return;
            const btn = document.getElementById(`cannon-tier-btn-${tier.id}`);
            if (!btn) return;
            btn.addEventListener('click', () => this._tryUpgrade(tier));
        });
    }

    _tryUpgrade(tier) {
        const s  = this.scene;
        const cur = s.playerCannonTier ?? 0;
        if (cur >= tier.id) {
            s.showStatusMsg?.(`Bereits auf ${TIERS[cur].name} aufgewertet!`, 0xffaa44);
            return;
        }
        if (tier.id !== cur + 1) {
            s.showStatusMsg?.(`Stufe für Stufe aufwerten! Nächste: ${TIERS[cur + 1].name}`, 0xff8844);
            return;
        }
        const gold = s.player?.gold ?? 0;
        if (gold < tier.cost) {
            s.showStatusMsg?.(`Nicht genug Gold! Kosten: ${tier.cost} Gold`, 0xff6644);
            return;
        }
        s.player.gold -= tier.cost;
        this._saveTier(tier.id);
        s.updateUIBars?.();
        s.showStatusMsg?.(`💣 Kanone aufgewertet: ${tier.name}! ${tier.desc}`, 0xffd700);
        this._refreshCards();
    }

    _refreshCards() {
        const cur = this.scene.playerCannonTier ?? 0;
        const curTier = TIERS[cur];
        TIERS.forEach(tier => {
            const card  = document.getElementById(`cannon-tier-card-${tier.id}`);
            const badge = document.getElementById(`cannon-tier-badge-${tier.id}`);
            const btn   = document.getElementById(`cannon-tier-btn-${tier.id}`);
            if (!card) return;

            const isActive  = tier.id === cur;
            const isOwned   = tier.id <= cur;
            const isNext    = tier.id === cur + 1;

            card.style.boxShadow = isActive
                ? `0 0 16px ${curTier.border.replace('0.55', '0.45').replace('0.65', '0.45').replace('0.75', '0.5')}`
                : 'none';
            card.style.opacity   = isOwned || isNext ? '1' : '0.55';

            if (badge) badge.style.display = isActive ? 'inline-block' : 'none';
            if (btn) {
                if (isOwned) {
                    btn.textContent = '✓ Besessen';
                    btn.style.opacity = '0.5';
                    btn.style.cursor  = 'default';
                } else if (isNext) {
                    btn.textContent = `${tier.cost.toLocaleString('de-DE')} Gold`;
                    btn.style.opacity = '1';
                    btn.style.cursor  = 'pointer';
                } else {
                    btn.textContent = 'Gesperrt';
                    btn.style.opacity = '0.4';
                    btn.style.cursor  = 'default';
                }
            }
        });
    }

    show() {
        this.visible = true;
        this._el.style.display = 'flex';
        this._loadTier();
        this._refreshCards();
    }

    hide() {
        this.visible = false;
        this._el.style.display = 'none';
    }

    toggle() { this.visible ? this.hide() : this.show(); }

    destroy() {
        if (this._el?.parentNode) this._el.parentNode.removeChild(this._el);
    }

    /** Apply the tier bonuses to cannon combat stats object */
    static applyTierBonus(stats, tier) {
        const t = TIERS[Math.min(4, Math.max(0, tier ?? 0))];
        stats.range              = Math.round(stats.range * t.rangeMult);
        stats.reloadTime         = Math.round(stats.reloadTime * t.reloadMult);
        stats.totalDamagePerShot = Math.round(stats.totalDamagePerShot * t.dmgMult);
        stats.damageProfile.minDamage = stats.totalDamagePerShot;
        stats.damageProfile.maxDamage = stats.totalDamagePerShot;
        return stats;
    }

    static getTierName(tier) { return TIERS[Math.min(4, Math.max(0, tier ?? 0))].name; }
    static getTierIcon(tier) { return TIERS[Math.min(4, Math.max(0, tier ?? 0))].icon; }
    static getTierColor(tier){ return TIERS[Math.min(4, Math.max(0, tier ?? 0))].color; }
}
