/* ══════════════════════════════════════════════════════════════
   CoordHUD — Seafight-Stil Koordinatenanzeige
   Positioniert sich direkt UNTER der Minimap (repositionUnderMinimap).
   Zeigt: Karten-Sektor (A1–E2) und Feld (A1–H8) synchron zur Minimap.
   Aktualisiert ~4×/Sekunde vom GameScene update()-Loop.
══════════════════════════════════════════════════════════════ */
export default class CoordHUD {
    constructor(scene) {
        this.scene  = scene;
        this._el    = null;
        this._lastX = -1;
        this._lastY = -1;
        this._build();
    }

    _build() {
        if (document.getElementById('ahc-coord-hud')) return;

        const el = document.createElement('div');
        el.id = 'ahc-coord-hud';
        el.style.cssText = `
            position: fixed;
            top: -200px;
            right: 12px;
            z-index: 8100;
            background: linear-gradient(160deg, rgba(8,18,32,0.96), rgba(6,14,26,0.98));
            border: 1px solid rgba(180,140,50,0.55);
            border-top: none;
            border-radius: 0 0 6px 6px;
            padding: 3px 8px 4px 8px;
            font-family: 'Georgia', 'Times New Roman', serif;
            font-size: 9px;
            color: #c8a84a;
            pointer-events: none;
            user-select: none;
            -webkit-user-select: none;
            line-height: 1.45;
            box-shadow: 0 3px 10px rgba(0,0,0,0.5), inset 0 0 8px rgba(180,140,50,0.04);
            min-width: 90px;
            text-align: center;
        `;
        el.innerHTML = `
            <div id="ahc-coord-sector" style="font-size:11px;font-weight:bold;color:#d4aa40;letter-spacing:1px;text-shadow:0 0 6px rgba(212,170,64,0.4);">—</div>
            <div id="ahc-coord-field"  style="font-size:8px;color:#a08030;letter-spacing:0.5px;">Feld —</div>
        `;
        document.body.appendChild(el);
        this._el = el;

        this.scene.events.once('shutdown', () => { el.remove(); this._el = null; });
    }

    /* Wird von updateUIBars() aufgerufen, sobald die Minimap-Position bekannt ist */
    repositionUnderMinimap(mmLeft, mmTop, mmHeight, mmWidth) {
        if (!this._el) return;
        const gap = 0;
        this._el.style.top    = `${Math.round(mmTop + mmHeight + gap)}px`;
        this._el.style.right  = '12px';
        this._el.style.left   = 'auto';
        this._el.style.bottom = 'auto';
        this._el.style.width  = `${Math.round(mmWidth)}px`;
        this._el.style.minWidth = 'unset';
        this._el.style.boxSizing = 'border-box';
    }

    /* Wird vom Game-Loop aufgerufen (throttled).
       sectorLabel = "A1" (Karten-Sektor im 2×5 Atlas)
       field       = "D6" (innerhalb der Karte in ein 8×8 Raster)
       x, y        = Rohkoordinaten in Weltpixeln */
    update(sectorLabel, field, x, y) {
        if (!this._el) return;
        if (Math.abs(x - this._lastX) < 8 && Math.abs(y - this._lastY) < 8) return;

        this._lastX = x;
        this._lastY = y;

        const sEl = document.getElementById('ahc-coord-sector');
        const fEl = document.getElementById('ahc-coord-field');

        if (sEl) sEl.textContent = sectorLabel;
        if (fEl) fEl.textContent = `Feld ${field}`;
    }

    destroy() {
        this._el?.remove();
        this._el = null;
    }
}
