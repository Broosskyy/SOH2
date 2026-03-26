const REPUTATION_RANKS = [
    { name: 'Unbekannt',   minRep: 0,    color: '#888888', icon: '⚓' },
    { name: 'Matrose',     minRep: 100,  color: '#7fd3ff', icon: '⛵' },
    { name: 'Seemann',     minRep: 350,  color: '#4ac8ff', icon: '🌊' },
    { name: 'Freibeuter',  minRep: 800,  color: '#ffa040', icon: '⚔' },
    { name: 'Pirat',       minRep: 1800, color: '#ff6644', icon: '🏴' },
    { name: 'Korsar',      minRep: 4000, color: '#e040ff', icon: '💀' },
    { name: 'Kapitän',     minRep: 8000, color: '#ffd36a', icon: '👑' },
    { name: 'Legende',     minRep: 20000,color: '#fff7a0', icon: '⭐' },
];

export default class ReputationHUD {
    constructor(scene) {
        this.scene = scene;
        this.reputation = 0;
        this.bounty = 0;
        this._el = null;
        this._build();
        this._loadSaved();
    }

    _build() {
        const el = document.createElement('div');
        el.id = 'rep-hud';
        el.style.cssText = `
            position: fixed;
            top: 116px;
            left: 0;
            width: 166px;
            z-index: 8800;
            display: flex;
            flex-direction: column;
            gap: 0;
            pointer-events: none;
            font-family: Arial, sans-serif;
        `;

        el.innerHTML = `
            <div id="rep-rank-bar" style="
                display:flex;align-items:center;gap:4px;
                padding:3px 8px 3px 10px;
                background:linear-gradient(90deg,rgba(3,10,24,0.95) 0%,rgba(3,10,24,0.75) 70%,transparent 100%);
                border-bottom:1px solid rgba(212,175,55,0.18);
                border-right:1px solid rgba(212,175,55,0.10);
            ">
                <span id="rep-icon" style="font-size:11px;">⚓</span>
                <span id="rep-name" style="font-size:8px;font-weight:bold;color:#888;letter-spacing:0.5px;flex-shrink:0;">UNBEKANNT</span>
                <div style="flex:1;height:3px;background:rgba(255,255,255,0.07);border-radius:2px;overflow:hidden;margin:0 3px;">
                    <div id="rep-bar" style="height:100%;width:0%;background:#888;border-radius:2px;transition:width 0.6s ease;"></div>
                </div>
                <span id="rep-val" style="font-size:8px;color:#666;min-width:24px;text-align:right;">0</span>
            </div>
            <div id="bounty-bar" style="
                display:none;align-items:center;gap:3px;
                padding:2px 8px 2px 10px;
                background:linear-gradient(90deg,rgba(20,4,4,0.92) 0%,rgba(20,4,4,0.60) 70%,transparent 100%);
                border-right:1px solid rgba(255,80,0,0.10);
            ">
                <span style="font-size:9px;">💰</span>
                <span style="font-size:8px;color:#ff8844;">Kopfgeld:</span>
                <span id="bounty-val" style="font-size:9px;font-weight:bold;color:#ffd36a;">0</span>
                <span style="font-size:8px;color:#ff6633;">Gold</span>
            </div>
        `;

        document.body.appendChild(el);
        this._el = el;
    }

    _loadSaved() {
        try {
            const raw = localStorage.getItem('ahc_reputation');
            if (raw) {
                const d = JSON.parse(raw);
                this.reputation = d.reputation ?? 0;
                this.bounty = d.bounty ?? 0;
                this._refresh();
            }
        } catch (e) {}
    }

    _save() {
        try {
            localStorage.setItem('ahc_reputation', JSON.stringify({
                reputation: this.reputation,
                bounty: this.bounty
            }));
        } catch (e) {}
    }

    _getRank(rep) {
        for (let i = REPUTATION_RANKS.length - 1; i >= 0; i--) {
            if (rep >= REPUTATION_RANKS[i].minRep) return { ...REPUTATION_RANKS[i], index: i };
        }
        return { ...REPUTATION_RANKS[0], index: 0 };
    }

    _refresh() {
        const rank = this._getRank(this.reputation);
        const nextRank = REPUTATION_RANKS[rank.index + 1];
        const pct = nextRank
            ? Math.min(100, ((this.reputation - rank.minRep) / (nextRank.minRep - rank.minRep)) * 100)
            : 100;

        const nameEl = document.getElementById('rep-name');
        const iconEl = document.getElementById('rep-icon');
        const barEl  = document.getElementById('rep-bar');
        const valEl  = document.getElementById('rep-val');
        const bountyBar = document.getElementById('bounty-bar');
        const bountyVal = document.getElementById('bounty-val');

        if (nameEl) { nameEl.textContent = rank.name.toUpperCase(); nameEl.style.color = rank.color; }
        if (iconEl) iconEl.textContent = rank.icon;
        if (barEl)  { barEl.style.width = `${pct.toFixed(0)}%`; barEl.style.background = rank.color; barEl.style.boxShadow = `0 0 4px ${rank.color}88`; }
        if (valEl)  { valEl.textContent = this.reputation >= 1000 ? `${(this.reputation/1000).toFixed(1)}K` : `${this.reputation}`; valEl.style.color = rank.color; }
        if (bountyBar) bountyBar.style.display = this.bounty > 0 ? 'flex' : 'none';
        if (bountyVal) bountyVal.textContent = this.bounty.toLocaleString();
    }

    addReputation(amount, reason = '') {
        const before = this._getRank(this.reputation);
        this.reputation = Math.max(0, this.reputation + amount);
        const after = this._getRank(this.reputation);
        this._refresh();
        this._save();
        if (after.index > before.index) {
            this._showRankUp(after);
        }
    }

    addBounty(amount) {
        this.bounty = Math.max(0, this.bounty + amount);
        this._refresh();
        this._save();
    }

    clearBounty() {
        this.bounty = 0;
        this._refresh();
        this._save();
    }

    _showRankUp(rank) {
        const popup = document.createElement('div');
        popup.style.cssText = `
            position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) scale(0.7);
            z-index:14000;display:flex;flex-direction:column;align-items:center;gap:6px;
            padding:20px 40px;
            background:linear-gradient(160deg,rgba(4,12,28,0.98),rgba(8,24,52,0.97));
            border:2px solid ${rank.color};border-radius:16px;
            box-shadow:0 0 40px ${rank.color}55;
            font-family:Arial;text-align:center;
            opacity:0;transition:all 0.4s cubic-bezier(0.34,1.56,0.64,1);
            pointer-events:none;
        `;
        popup.innerHTML = `
            <div style="font-size:32px;">${rank.icon}</div>
            <div style="font-size:10px;color:#9fdcff;letter-spacing:2px;text-transform:uppercase;">Neuer Ruf-Rang!</div>
            <div style="font-size:24px;font-weight:900;color:${rank.color};text-shadow:0 0 16px ${rank.color}88;">${rank.name}</div>
        `;
        document.body.appendChild(popup);
        requestAnimationFrame(() => {
            popup.style.opacity = '1';
            popup.style.transform = 'translate(-50%,-50%) scale(1)';
        });
        setTimeout(() => {
            popup.style.opacity = '0';
            popup.style.transform = 'translate(-50%,-50%) scale(0.8)';
            setTimeout(() => popup.remove(), 400);
        }, 3000);
    }

    destroy() { this._el?.remove(); }
}
