const ITEM_DEFS = {
    heiltrunk:  { name: 'Heiltrank',  icon: '🧪', desc: 'Heilt 30% HP sofort',         color: '#ff6b6b', key: '1' },
    repair_kit: { name: 'Reparatur',  icon: '🔧', desc: '+80 HP sofort',                color: '#7fffb0', key: '2' },
    grog:       { name: 'Grog',       icon: '🍺', desc: '+50% Speed 30 Sek.',          color: '#ffa040', key: '3' },
    blitzpulver:{ name: 'Blitz',      icon: '⚡', desc: 'Nächster Schuss: 3× Schaden', color: '#ffe84a', key: '4' },
    rum:        { name: 'Rum',        icon: '🛢', desc: '+100% XP 60 Sek.',            color: '#c88040', key: '5' },
    fernrohr:   { name: 'Fernrohr',   icon: '🔭', desc: 'Nächste Schatztruhe',         color: '#9370db', key: '6' },
    lucky_charm:{ name: 'Glücksbr.',  icon: '🍀', desc: 'Crit +15% für 30 Sek.',      color: '#88ffcc', key: '7' },
};

const ITEM_ORDER = ['heiltrunk', 'repair_kit', 'grog', 'blitzpulver', 'rum', 'fernrohr', 'lucky_charm'];

export default class ItemBar {
    constructor(scene) {
        this.scene = scene;
        this._el = null;
        this._buttonWrap = null;
        this._mainButton = null;
        this._mainCount = null;
        this._popup = null;
        this._list = null;
        this._slots = [];
        this._tooltip = null;
        this._styleEl = null;
        this._isOpen = false;
        this._isVisible = true;
        this._inventoryState = {};
        this._activeEffectsState = {};
        this._build();
        this._buildTooltip();
        this._bindHotkeys();
    }

    _injectStyles() {
        if (document.getElementById('item-popup-styles')) return;

        const style = document.createElement('style');
        style.id = 'item-popup-styles';
        style.textContent = `
            #item-button-root {
                position: fixed;
                right: calc(134px + env(safe-area-inset-right, 0px));
                bottom: calc(8px + env(safe-area-inset-bottom, 0px));
                z-index: 8050;
                display: flex;
                align-items: flex-end;
                pointer-events: auto;
                user-select: none;
                -webkit-user-select: none;
            }

            .item-main-wrap {
                position: relative;
                cursor: pointer;
                touch-action: manipulation;
                -webkit-tap-highlight-color: transparent;
                transition: transform 0.12s ease;
            }

            .item-main-wrap:hover {
                transform: scale(1.03);
            }

            .item-main-wrap.is-pressed {
                transform: scale(0.95);
            }

            .item-main-btn {
                width: 50px;
                height: 50px;
                border-radius: 50%;
                position: relative;
                overflow: hidden;
                border: 4px solid #c79437;
                background: radial-gradient(circle at 38% 32%, rgba(255,255,255,0.12) 0%, rgba(44,28,18,0.98) 62%);
                box-shadow:
                    inset 0 0 14px rgba(255,230,160,0.08),
                    0 4px 18px rgba(0,0,0,0.72);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
            }

            .item-main-btn::before {
                content: "";
                position: absolute;
                inset: 0;
                border-radius: 50%;
                background: radial-gradient(circle at 34% 28%, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.04) 26%, transparent 58%);
                pointer-events: none;
            }

            .item-main-icon {
                position: relative;
                z-index: 1;
                font-size: 18px;
                line-height: 1;
            }

            .item-main-label {
                position: relative;
                z-index: 1;
                margin-top: 2px;
                font-family: Arial, sans-serif;
                font-size: 9px;
                font-weight: bold;
                color: #f6d57b;
                line-height: 1;
                text-shadow: 0 0 6px rgba(0,0,0,0.75);
            }

            .item-main-count {
                position: absolute;
                top: 8px;
                left: 8px;
                z-index: 2;
                min-width: 18px;
                height: 18px;
                padding: 0 4px;
                border-radius: 10px;
                background: rgba(10,18,30,0.92);
                border: 1px solid rgba(212,175,55,0.55);
                color: #ffffff;
                font-family: Arial, sans-serif;
                font-size: 10px;
                font-weight: bold;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 1px 4px rgba(0,0,0,0.6);
            }

            .item-main-caret {
                position: absolute;
                bottom: 5px;
                right: 9px;
                z-index: 2;
                color: rgba(255,230,170,0.9);
                font-size: 11px;
                font-family: Arial, sans-serif;
                font-weight: bold;
                text-shadow: 0 0 6px rgba(0,0,0,0.8);
            }

            .item-main-glow {
                position: absolute;
                inset: 0;
                border-radius: 50%;
                box-shadow: 0 0 18px rgba(255,214,106,0.35);
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.14s ease;
            }

            .item-main-wrap.has-active .item-main-glow {
                opacity: 1;
            }

            .item-popup {
                position: fixed;
                left: 50%;
                top: 52%;
                transform: translate(-50%, -50%);
                width: min(380px, 72vw);
                max-height: min(340px, 58vh);
                display: none;
                flex-direction: column;
                overflow: hidden;
                background: linear-gradient(180deg, rgba(14,22,36,0.97) 0%, rgba(10,16,28,0.97) 100%);
                border: 2px solid rgba(140,100,44,0.95);
                box-shadow: 0 8px 24px rgba(0,0,0,0.58);
                z-index: 8150;
            }

            .item-popup.open {
                display: flex;
            }

            .item-popup-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 10px;
                padding: 8px 10px;
                font-family: Arial, sans-serif;
                font-size: 12px;
                font-weight: bold;
                color: #f0d45f;
                background: linear-gradient(180deg, rgba(18,26,40,0.98) 0%, rgba(14,20,32,0.98) 100%);
                border-bottom: 1px solid rgba(180,130,60,0.8);
                flex-shrink: 0;
            }

            .item-popup-title {
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .item-popup-close {
                width: 22px;
                height: 22px;
                min-width: 22px;
                border: 1px solid rgba(180,130,60,0.85);
                background: rgba(40,22,12,0.92);
                color: #f0d45f;
                font-family: Arial, sans-serif;
                font-size: 14px;
                font-weight: bold;
                line-height: 1;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                -webkit-tap-highlight-color: transparent;
            }

            .item-popup-close:hover {
                background: rgba(60,30,16,0.96);
            }

            .item-popup-list {
                display: flex;
                flex-direction: column;
                overflow-y: auto;
                overflow-x: hidden;
                max-height: calc(min(340px, 58vh) - 42px);
                scrollbar-width: auto;
                scrollbar-color: rgba(212,170,64,0.95) rgba(8,12,18,0.7);
                -webkit-overflow-scrolling: touch;
                touch-action: pan-y;
            }

            .item-popup-list::-webkit-scrollbar {
                width: 12px;
            }

            .item-popup-list::-webkit-scrollbar-track {
                background: rgba(8,12,18,0.7);
                border-left: 1px solid rgba(180,130,60,0.25);
            }

            .item-popup-list::-webkit-scrollbar-thumb {
                background: linear-gradient(180deg, rgba(212,170,64,0.95) 0%, rgba(150,108,40,0.95) 100%);
                border: 1px solid rgba(255,220,140,0.35);
            }

            .item-option {
                display: flex;
                align-items: stretch;
                min-height: 58px;
                background: rgba(26,28,38,0.95);
                border-top: 1px solid rgba(90,70,50,0.42);
                cursor: pointer;
                transition: background 0.12s ease;
                position: relative;
                flex-shrink: 0;
            }

            .item-option:hover {
                background: rgba(34,38,52,0.97);
            }

            .item-option.is-active {
                background: rgba(45,40,24,0.97);
                box-shadow: inset 0 0 0 1px rgba(212,170,64,0.42);
            }

            .item-option.is-empty {
                opacity: 0.5;
            }

            .item-icon-box {
                width: 56px;
                min-width: 56px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-right: 1px solid rgba(140,100,44,0.36);
                position: relative;
                background: linear-gradient(180deg, rgba(36,28,18,0.96) 0%, rgba(28,22,14,0.96) 100%);
            }

            .item-icon {
                width: 36px;
                height: 36px;
                border: 2px solid rgba(150,108,52,0.95);
                background: radial-gradient(circle at 35% 30%, rgba(255,255,255,0.12) 0%, rgba(0,0,0,0.18) 55%, rgba(0,0,0,0.4) 100%);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 18px;
                box-shadow: inset 0 0 12px rgba(255,255,255,0.04);
            }

            .item-stock {
                position: absolute;
                left: 5px;
                bottom: 3px;
                font-family: Arial, sans-serif;
                font-size: 10px;
                font-weight: bold;
                color: #ffffff;
                text-shadow: 0 1px 3px rgba(0,0,0,0.9);
            }

            .item-key {
                position: absolute;
                top: 4px;
                right: 5px;
                font-family: Arial, sans-serif;
                font-size: 9px;
                font-weight: bold;
                color: rgba(255,230,170,0.82);
            }

            .item-info {
                flex: 1;
                display: flex;
                flex-direction: column;
                justify-content: center;
                padding: 6px 8px;
                gap: 2px;
                min-width: 0;
            }

            .item-title {
                font-family: Arial, sans-serif;
                font-size: 12px;
                color: #f4f4f4;
                line-height: 1.1;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .item-desc {
                font-family: Arial, sans-serif;
                font-size: 10px;
                color: #d4d4d4;
                line-height: 1.1;
            }

            @media screen and (max-width: 900px) {
                #item-button-root {
                    right: calc(130px + env(safe-area-inset-right, 0px));
                    bottom: calc(6px + env(safe-area-inset-bottom, 0px));
                }

                .item-main-btn {
                    width: 46px;
                    height: 46px;
                }

                .item-main-icon {
                    font-size: 16px;
                }

                .item-main-label {
                    font-size: 8px;
                }

                .item-popup {
                    width: min(320px, 82vw);
                    max-height: min(280px, 50vh);
                    top: 50%;
                }

                .item-popup-list {
                    max-height: calc(min(280px, 50vh) - 42px);
                }

                .item-option {
                    min-height: 54px;
                }

                .item-icon-box {
                    width: 50px;
                    min-width: 50px;
                }

                .item-icon {
                    width: 32px;
                    height: 32px;
                    font-size: 16px;
                }

                .item-title {
                    font-size: 11px;
                }

                .item-desc {
                    font-size: 9px;
                }

                .item-popup-close {
                    width: 20px;
                    height: 20px;
                    min-width: 20px;
                    font-size: 13px;
                }
            }
        `;
        document.head.appendChild(style);
        this._styleEl = style;
    }

    _build() {
        this._injectStyles();

        const root = document.createElement('div');
        root.id = 'item-button-root';

        const mainWrap = document.createElement('div');
        mainWrap.className = 'item-main-wrap';

        const mainBtn = document.createElement('div');
        mainBtn.className = 'item-main-btn';

        const mainGlow = document.createElement('div');
        mainGlow.className = 'item-main-glow';

        const mainCount = document.createElement('div');
        mainCount.className = 'item-main-count';
        mainCount.textContent = '0';

        const mainIcon = document.createElement('div');
        mainIcon.className = 'item-main-icon';
        mainIcon.textContent = '🎒';

        const mainLabel = document.createElement('div');
        mainLabel.className = 'item-main-label';
        mainLabel.textContent = 'Items';

        const caret = document.createElement('div');
        caret.className = 'item-main-caret';
        caret.textContent = '▲';

        mainBtn.appendChild(mainGlow);
        mainBtn.appendChild(mainCount);
        mainBtn.appendChild(mainIcon);
        mainBtn.appendChild(mainLabel);
        mainBtn.appendChild(caret);
        mainWrap.appendChild(mainBtn);

        const popup = document.createElement('div');
        popup.className = 'item-popup';

        const header = document.createElement('div');
        header.className = 'item-popup-header';

        const title = document.createElement('div');
        title.className = 'item-popup-title';
        title.textContent = 'Gegenstände';

        const close = document.createElement('div');
        close.className = 'item-popup-close';
        close.textContent = '✕';

        close.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this._closePopup();
        });
        close.addEventListener('touchend', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this._closePopup();
        }, { passive: false });

        header.appendChild(title);
        header.appendChild(close);

        const list = document.createElement('div');
        list.className = 'item-popup-list';

        let isScrolling = false;
        let touchStartY = 0;
        let touchStartX = 0;

        list.addEventListener('touchstart', (e) => {
            isScrolling = false;
            const t = e.touches?.[0];
            if (t) {
                touchStartY = t.clientY;
                touchStartX = t.clientX;
            }
            e.stopPropagation();
        }, { passive: true });

        list.addEventListener('touchmove', (e) => {
            const t = e.touches?.[0];
            if (t) {
                const dy = Math.abs(t.clientY - touchStartY);
                const dx = Math.abs(t.clientX - touchStartX);
                if (dy > 8 || dx > 8) {
                    isScrolling = true;
                }
            }
            e.stopPropagation();
        }, { passive: true });

        list.addEventListener('touchend', (e) => {
            e.stopPropagation();
            setTimeout(() => { isScrolling = false; }, 50);
        }, { passive: false });

        list.addEventListener('wheel', (e) => {
            isScrolling = true;
            e.stopPropagation();
            clearTimeout(this._wheelScrollTimer);
            this._wheelScrollTimer = setTimeout(() => {
                isScrolling = false;
            }, 120);
        }, { passive: true });

        popup.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true });
        popup.addEventListener('touchmove', (e) => e.stopPropagation(), { passive: true });
        popup.addEventListener('touchend', (e) => e.stopPropagation(), { passive: false });

        ITEM_ORDER.forEach((type) => {
            const def = ITEM_DEFS[type];

            const option = document.createElement('div');
            option.className = 'item-option';
            option.dataset.type = type;

            const iconBox = document.createElement('div');
            iconBox.className = 'item-icon-box';

            const icon = document.createElement('div');
            icon.className = 'item-icon';
            icon.textContent = def.icon;

            const stock = document.createElement('div');
            stock.className = 'item-stock';
            stock.textContent = '0';

            const keyEl = document.createElement('div');
            keyEl.className = 'item-key';
            keyEl.textContent = def.key;

            iconBox.appendChild(icon);
            iconBox.appendChild(stock);
            iconBox.appendChild(keyEl);

            const info = document.createElement('div');
            info.className = 'item-info';

            const titleEl = document.createElement('div');
            titleEl.className = 'item-title';
            titleEl.style.color = def.color;
            titleEl.textContent = `${def.icon} ${def.name}`;

            const descEl = document.createElement('div');
            descEl.className = 'item-desc';
            descEl.textContent = def.desc;

            info.appendChild(titleEl);
            info.appendChild(descEl);

            option.appendChild(iconBox);
            option.appendChild(info);

            const useItem = (e) => {
                if (isScrolling) {
                    e.preventDefault();
                    e.stopPropagation();
                    return;
                }

                const count = this._inventoryState?.[type] ?? 0;
                if (count <= 0) {
                    e.preventDefault();
                    e.stopPropagation();
                    return;
                }

                e.preventDefault();
                e.stopPropagation();
                this._pressFeedback(option);
                this.scene.useItem?.(type);
                this._closePopup();
            };

            option.addEventListener('click', useItem);
            option.addEventListener('touchend', useItem, { passive: false });

            list.appendChild(option);
            this._slots.push({ type, el: option, stockEl: stock, iconEl: icon, titleEl, descEl });
        });

        popup.appendChild(header);
        popup.appendChild(list);

        const togglePopup = (e) => {
            e.preventDefault();
            e.stopPropagation();
            this._pressFeedback(mainWrap);
            this._togglePopup();
        };

        mainWrap.addEventListener('click', togglePopup);
        mainWrap.addEventListener('touchend', togglePopup, { passive: false });

        root.appendChild(mainWrap);
        document.body.appendChild(root);
        document.body.appendChild(popup);

        this._el = root;
        this._buttonWrap = mainWrap;
        this._mainButton = mainBtn;
        this._mainCount = mainCount;
        this._popup = popup;
        this._list = list;
    }

    _buildTooltip() {
        const tip = document.createElement('div');
        tip.id = 'item-tooltip';
        tip.style.cssText = `
            position:fixed;
            z-index:20000;
            display:none;
            padding:8px 12px;
            background:rgba(3,10,24,0.97);
            border:1px solid rgba(212,175,55,0.5);
            border-radius:8px;
            font-family:Arial;
            font-size:11px;
            color:#dff8ff;
            max-width:180px;
            box-shadow:0 4px 20px rgba(0,0,0,0.8);
            pointer-events:none;
            line-height:1.6;
        `;
        document.body.appendChild(tip);
        this._tooltip = tip;
    }

    _showTooltip(anchor, def) {
        const tip = this._tooltip;
        if (!tip) return;
        tip.innerHTML = `<b style="color:${def.color}">${def.icon} ${def.name}</b><br><span style="color:#9fdcff">${def.desc}</span>`;
        tip.style.display = 'block';
        const rect = anchor.getBoundingClientRect();
        tip.style.left = `${Math.max(4, rect.left - 184)}px`;
        tip.style.top = `${rect.top - 2}px`;
    }

    _hideTooltip() {
        if (this._tooltip) this._tooltip.style.display = 'none';
    }

    _bindHotkeys() {
        this._keyHandler = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            const idx = parseInt(e.key, 10) - 1;
            if (idx >= 0 && idx < ITEM_ORDER.length && !e.ctrlKey && !e.altKey && !e.shiftKey) {
                this.scene.useItem?.(ITEM_ORDER[idx]);
            }
        };
        document.addEventListener('keydown', this._keyHandler);
    }

    _pressFeedback(el) {
        el.classList.add('is-pressed');
        setTimeout(() => el.classList.remove('is-pressed'), 110);
    }

    _togglePopup() {
        this._isOpen = !this._isOpen;
        this._popup?.classList.toggle('open', this._isOpen);
        const caret = this._mainButton?.querySelector('.item-main-caret');
        if (caret) caret.textContent = this._isOpen ? '▼' : '▲';
    }

    _closePopup() {
        this._isOpen = false;
        this._popup?.classList.remove('open');
        const caret = this._mainButton?.querySelector('.item-main-caret');
        if (caret) caret.textContent = '▲';
    }

    update(inventory, activeEffects = {}) {
        this._inventoryState = { ...inventory };
        this._activeEffectsState = { ...activeEffects };

        let totalCount = 0;
        let hasActiveEffect = false;

        this._slots.forEach(({ type, el, stockEl, titleEl }) => {
            const def = ITEM_DEFS[type];
            const count = inventory?.[type] ?? 0;
            const isActive = !!activeEffects[type];
            const isEmpty = count <= 0;

            totalCount += count;
            if (isActive) hasActiveEffect = true;

            stockEl.textContent = count > 0 ? `×${count}` : '0';
            el.classList.toggle('is-active', isActive);
            el.classList.toggle('is-empty', isEmpty);

            if (titleEl) titleEl.style.color = def.color;
        });

        if (this._mainCount) {
            this._mainCount.textContent = String(totalCount);
        }

        if (this._buttonWrap) {
            this._buttonWrap.classList.toggle('has-active', hasActiveEffect);
        }
    }

    showPickupFlash(type) {
        const slot = this._slots.find(s => s.type === type);
        if (!slot) return;

        const def = ITEM_DEFS[type];
        slot.el.style.boxShadow = `0 0 24px ${def.color}cc`;
        slot.el.style.borderColor = def.color;
        slot.el.style.transform = 'scale(1.05)';

        if (this._buttonWrap) {
            this._buttonWrap.style.transform = 'scale(1.08)';
            setTimeout(() => {
                this._buttonWrap.style.transform = '';
            }, 260);
        }

        setTimeout(() => {
            slot.el.style.transform = '';
            slot.el.style.boxShadow = '';
            slot.el.style.borderColor = '';
        }, 500);
    }

    show() {
        this._isVisible = true;
        if (this._el) this._el.style.display = 'flex';
    }

    hide() {
        this._isVisible = false;
        this._closePopup();
        if (this._el) this._el.style.display = 'none';
    }

    destroy() {
        clearTimeout(this._wheelScrollTimer);
        document.removeEventListener('keydown', this._keyHandler);
        this._closePopup();
        this._el?.remove();
        this._popup?.remove();
        this._tooltip?.remove();
        this._styleEl?.remove();
    }
}