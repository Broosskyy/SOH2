export default class DomNavBar {
    constructor(scene) {
        this.scene = scene;
        this.visible = true;
        this._el = null;
        this._build();
    }

    _buttons() {
        return [
            { label: 'HUD',      icon: '☰',  action: () => this.toggle() },
            { label: 'Werft',    icon: '⚓', action: () => this.scene.handleMenuAction('shipyard') },
            { label: 'Mission',  icon: '⇪',  action: () => this.scene.handleMenuAction('missions') },
            { label: 'Bonus',    icon: '◎',  action: () => this.scene.handleMenuAction('bonus') },
            { label: 'Geschäft', icon: '🛒', action: () => this.scene.handleMenuAction('shop') },
            { label: 'Events',   icon: '★',  action: () => this.scene.handleMenuAction('events') },
            { label: 'Rang',     icon: '♛',  action: () => this.scene.handleMenuAction('rank') },
            { label: 'Kampf',    icon: '⚔',  action: () => this.scene.handleMenuAction('combat') },
            { label: 'Board',    icon: '🗺️', action: () => this.scene.handleMenuAction('board') },
            { label: 'Ausfahrt', icon: '⛵', action: () => this.scene.handleMenuAction('sail') },
        ];
    }

    _build() {
        const el = document.createElement('div');
        el.id = 'dom-nav-bar';
        el.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 9000;
            display: flex;
            flex-direction: row;
            align-items: stretch;
            background: linear-gradient(180deg, rgba(4,14,30,0.97) 0%, rgba(6,20,44,0.93) 100%);
            border-bottom: 2px solid rgba(74,200,255,0.4);
            box-shadow: 0 2px 16px rgba(0,0,0,0.7);
            overflow-x: auto;
            overflow-y: hidden;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
            font-family: Arial, sans-serif;
            user-select: none;
            -webkit-user-select: none;
            touch-action: pan-x;
            height: 62px;
            flex-shrink: 0;
        `;
        el.style.setProperty('scrollbar-width', 'none');

        this._buttons().forEach(btn => {
            const b = document.createElement('button');
            b.style.cssText = `
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-width: 68px;
                padding: 4px 10px;
                background: transparent;
                border: none;
                border-right: 1px solid rgba(74,200,255,0.15);
                color: #dff8ff;
                cursor: pointer;
                -webkit-tap-highlight-color: transparent;
                touch-action: manipulation;
                flex-shrink: 0;
                transition: background 0.12s;
                gap: 2px;
                outline: none;
            `;
            b.innerHTML = `
                <span style="font-size:18px;line-height:1.1;">${btn.icon}</span>
                <span style="font-size:10px;color:#9fdcff;letter-spacing:0.5px;">${btn.label}</span>
            `;
            const activate = (e) => {
                e.preventDefault();
                e.stopPropagation();
                b.style.background = 'rgba(74,200,255,0.18)';
                setTimeout(() => { b.style.background = 'transparent'; }, 180);
                btn.action();
            };
            b.addEventListener('touchend', activate, { passive: false });
            b.addEventListener('click', activate);
            b.addEventListener('touchstart', (e) => {
                b.style.background = 'rgba(74,200,255,0.12)';
            }, { passive: true });
            el.appendChild(b);
        });

        document.body.appendChild(el);
        this._el = el;
    }

    show() {
        if (this._el) { this._el.style.display = 'flex'; this.visible = true; }
    }

    hide() {
        if (this._el) { this._el.style.display = 'none'; this.visible = false; }
    }

    toggle() {
        if (this.visible) this.hide(); else this.show();
    }

    destroy() {
        if (this._el?.parentNode) this._el.parentNode.removeChild(this._el);
    }
}
