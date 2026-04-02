/* ══════════════════════════════════════════════════════════════
   CoordHUD — Seafight-Stil Koordinatenanzeige
   Zeigt: Karten-Sektor (A1–E2), Feld innerhalb der Karte,
          und genaue Pixel-Koordinaten.
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
            right: 10px;
            bottom: 5px;
            z-index: 8100;
            background: linear-gradient(160deg, rgba(6,16,34,0.95), rgba(8,22,46,0.97));
            border: 1px solid rgba(99,214,255,0.4);
            border-radius: 8px;
            padding: 5px 10px 5px 9px;
            font-family: 'Courier New', monospace;
            font-size: 10px;
            color: #9fdcff;
            pointer-events: none;
            user-select: none;
            -webkit-user-select: none;
            line-height: 1.55;
            box-shadow: 0 0 12px rgba(40,150,255,0.15);
            min-width: 110px;
        `;
        el.innerHTML = `
            <div id="ahc-coord-sector" style="font-size:12px;font-weight:bold;color:#63d6ff;letter-spacing:1px;">—</div>
            <div id="ahc-coord-field"  style="font-size:9px;color:#5a9ab8;">Feld —</div>
            <div id="ahc-coord-raw"    style="font-size:8px;color:#3a7090;margin-top:1px;">X: — / Y: —</div>
        `;
        document.body.appendChild(el);
        this._el = el;

        this.scene.events.once('shutdown', () => { el.remove(); this._el = null; });
    }

    /* Wird vom Game-Loop aufgerufen (throttled).
       sectorLabel = "A1" (Karten-Sektor im 2×5 Atlas)
       field       = "D6" (innerhalb der Karte in ein 8×8 Raster)
       x, y        = Rohkoordinaten in Weltpixeln */
    update(sectorLabel, field, x, y) {
        if (!this._el) return;
        if (Math.abs(x - this._lastX) < 8 && Math.abs(y - this._lastY) < 8) return; /* skip wenn kein Move */

        this._lastX = x;
        this._lastY = y;

        const sEl = document.getElementById('ahc-coord-sector');
        const fEl = document.getElementById('ahc-coord-field');
        const rEl = document.getElementById('ahc-coord-raw');

        if (sEl) sEl.textContent = sectorLabel;
        if (fEl) fEl.textContent = `Feld ${field}`;
        if (rEl) rEl.textContent = `X: ${Math.round(x)} / Y: ${Math.round(y)}`;
    }

    destroy() {
        this._el?.remove();
        this._el = null;
    }
}
