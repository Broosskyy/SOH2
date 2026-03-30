export default class AmmoBar {
    constructor(scene) {
        this.scene = scene;
        this._activeAmmo = 'cannonball';
        this._el = null;
        this._ammoMenuOpen = false;
        this._mainAmmoBtn = null;
        this._ammoMenuEl = null;
        this._ammoMenuOptions = {};
        this._skillEls = {};
        this._styleEl = null;
        this._build();
    }

    _ammoDefs() {
        return [
            {
                type: 'cannonball',
                short: 'IB',
                label: 'Hohle Kanonenkugel',
                color: '#d7e8f6',
                glow: 'rgba(159,220,255,0.45)',
                bg: 'rgba(18,34,56,0.96)',
                damage: '1x',
                towerDamage: '1x'
            },
            {
                type: 'flare',
                short: 'LG',
                label: 'Leuchtkugel',
                color: '#ffd36a',
                glow: 'rgba(255,211,106,0.5)',
                bg: 'rgba(58,42,8,0.96)',
                damage: '1.15x',
                towerDamage: '1.2x'
            },
            {
                type: 'fire',
                short: 'FG',
                label: 'Feuerball Kanonenkugel',
                color: '#ff7878',
                glow: 'rgba(255,96,96,0.5)',
                bg: 'rgba(62,14,14,0.96)',
                damage: '1.25x',
                towerDamage: '1.5x'
            },
            {
                type: 'storm',
                short: 'SK',
                label: 'Sturmkugel',
                color: '#72dfff',
                glow: 'rgba(99,214,255,0.5)',
                bg: 'rgba(14,36,68,0.96)',
                damage: '1.2x',
                towerDamage: '1.25x'
            },
            {
                type: 'chainshot',
                short: 'CS',
                label: 'Kettenschuss',
                color: '#8cffb8',
                glow: 'rgba(127,255,176,0.5)',
                bg: 'rgba(10,44,24,0.96)',
                damage: '1.1x',
                towerDamage: '0.9x'
            },
            {
                type: 'grapeshot',
                short: 'GS',
                label: 'Kartätsche',
                color: '#ffbe66',
                glow: 'rgba(255,179,71,0.5)',
                bg: 'rgba(58,30,8,0.96)',
                damage: '1.2x',
                towerDamage: '1.1x'
            }
        ];
    }

    _skillDefs() {
        return this.scene.combatSkillDefs ?? [
            { key: 'burst',  shortLabel: 'BST', fullLabel: 'Burst-Feuer',    color: '#ffb347', bg: 'rgba(60,30,0,0.95)' },
            { key: 'break',  shortLabel: 'BRK', fullLabel: 'Masten-Brecher', color: '#63d6ff', bg: 'rgba(10,40,70,0.95)' },
            { key: 'repair', shortLabel: 'RPR', fullLabel: 'Reparatur',      color: '#7fffb0', bg: 'rgba(10,50,25,0.95)' },
        ];
    }

    _injectStyles() {
        if (document.getElementById('ammo-bar-styles')) return;

        const style = document.createElement('style');
        style.id = 'ammo-bar-styles';
        style.textContent = `
            #ammo-bar {
                position: fixed;
                right: calc(192px + env(safe-area-inset-right, 0px));
                bottom: calc(8px + env(safe-area-inset-bottom, 0px));
                z-index: 8000;
                display: flex;
                align-items: flex-end;
                gap: 6px;
                pointer-events: auto;
                user-select: none;
                -webkit-user-select: none;
                padding-bottom: env(safe-area-inset-bottom, 0px);
            }

            .sf-skills-wrap {
                position: relative;
                display: flex;
                align-items: flex-end;
            }

            .sf-skills-toggle {
                width: 50px;
                height: 50px;
                border-radius: 50%;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                touch-action: manipulation;
                -webkit-tap-highlight-color: transparent;
                border: 2px solid rgba(100,200,140,0.85);
                background: radial-gradient(circle at 38% 32%, rgba(255,255,255,0.12) 0%, rgba(10,50,25,0.96) 62%);
                box-shadow: inset 0 0 8px rgba(100,255,160,0.06), 0 3px 10px rgba(0,0,0,0.72);
                color: #7fffb0;
                font-family: Arial, sans-serif;
                font-weight: bold;
                font-size: 9px;
                text-shadow: 0 0 6px rgba(0,0,0,0.9);
                transition: filter 0.1s, transform 0.08s;
            }

            .sf-skills-toggle:active {
                filter: brightness(1.4);
                transform: scale(0.93);
            }

            .sf-skills-popup {
                position: absolute;
                bottom: calc(100% + 8px);
                right: 0;
                display: none;
                flex-direction: column;
                gap: 4px;
                padding: 7px;
                background: linear-gradient(180deg, rgba(14,22,36,0.98) 0%, rgba(8,14,24,0.98) 100%);
                border: 2px solid rgba(140,100,44,0.95);
                border-radius: 10px;
                box-shadow: 0 6px 20px rgba(0,0,0,0.7);
                z-index: 8200;
                min-width: 148px;
                pointer-events: auto;
            }

            .sf-skills-popup.open {
                display: flex;
            }

            .sf-skills-popup-row {
                display: flex;
                align-items: center;
                gap: 9px;
                padding: 4px 5px;
                border-radius: 7px;
                cursor: pointer;
                touch-action: manipulation;
                -webkit-tap-highlight-color: transparent;
                transition: background 0.1s;
            }

            .sf-skills-popup-row:active {
                background: rgba(255,255,255,0.09);
            }

            .sf-skills-popup-name {
                font-family: Arial, sans-serif;
                font-size: 12px;
                color: #cce4ff;
                white-space: nowrap;
                font-weight: bold;
            }

            .sf-skill {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                position: relative;
                overflow: hidden;
                border: 2px solid rgba(142,110,52,0.9);
                box-shadow: inset 0 0 8px rgba(255,220,150,0.04), 0 3px 10px rgba(0,0,0,0.72);
                display: flex;
                align-items: center;
                justify-content: center;
                font-family: Arial, sans-serif;
                font-size: 10px;
                font-weight: bold;
                text-shadow: 0 0 8px currentColor;
                flex-shrink: 0;
            }

            .sf-ammo-stack {
                position: relative;
                display: flex;
                flex-direction: column;
                align-items: center;
            }

            .sf-ammo-panel {
                position: fixed;
                left: 50%;
                top: 52%;
                transform: translate(-50%, -50%);
                width: min(380px, 70vw);
                max-height: min(340px, 56vh);
                display: none;
                flex-direction: column;
                overflow: hidden;
                background: linear-gradient(180deg, rgba(14,22,36,0.97) 0%, rgba(10,16,28,0.97) 100%);
                border: 2px solid rgba(140,100,44,0.95);
                box-shadow: 0 8px 24px rgba(0,0,0,0.58);
                z-index: 8100;
            }

            .sf-ammo-panel.open {
                display: flex;
            }

            .sf-ammo-panel-header {
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

            .sf-ammo-panel-title {
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .sf-ammo-panel-close {
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

            .sf-ammo-panel-close:hover {
                background: rgba(60,30,16,0.96);
            }

            .sf-ammo-list {
                display: flex;
                flex-direction: column;
                overflow-y: auto;
                overflow-x: hidden;
                max-height: calc(min(340px, 56vh) - 42px);
                scrollbar-width: auto;
                scrollbar-color: rgba(212,170,64,0.95) rgba(8,12,18,0.7);
                -webkit-overflow-scrolling: touch;
                touch-action: pan-y;
            }

            .sf-ammo-list::-webkit-scrollbar {
                width: 12px;
            }

            .sf-ammo-list::-webkit-scrollbar-track {
                background: rgba(8,12,18,0.7);
                border-left: 1px solid rgba(180,130,60,0.25);
            }

            .sf-ammo-list::-webkit-scrollbar-thumb {
                background: linear-gradient(180deg, rgba(212,170,64,0.95) 0%, rgba(150,108,40,0.95) 100%);
                border: 1px solid rgba(255,220,140,0.35);
            }

            .sf-ammo-option {
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

            .sf-ammo-option:hover {
                background: rgba(34,38,52,0.97);
            }

            .sf-ammo-option.is-active {
                background: rgba(45,40,24,0.97);
                box-shadow: inset 0 0 0 1px rgba(212,170,64,0.42);
            }

            .sf-ammo-icon-box {
                width: 56px;
                min-width: 56px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-right: 1px solid rgba(140,100,44,0.36);
                position: relative;
                background: linear-gradient(180deg, rgba(36,28,18,0.96) 0%, rgba(28,22,14,0.96) 100%);
            }

            .sf-ammo-icon {
                width: 36px;
                height: 36px;
                border: 2px solid rgba(150,108,52,0.95);
                background: radial-gradient(circle at 35% 30%, rgba(255,255,255,0.12) 0%, rgba(0,0,0,0.18) 55%, rgba(0,0,0,0.4) 100%);
                display: flex;
                align-items: center;
                justify-content: center;
                font-family: Arial, sans-serif;
                font-weight: bold;
                font-size: 13px;
                color: #fff;
                box-shadow: inset 0 0 12px rgba(255,255,255,0.04);
            }

            .sf-ammo-stock {
                position: absolute;
                left: 5px;
                bottom: 3px;
                font-family: Arial, sans-serif;
                font-size: 10px;
                font-weight: bold;
                color: #ffffff;
                text-shadow: 0 1px 3px rgba(0,0,0,0.9);
            }

            .sf-ammo-info {
                flex: 1;
                display: flex;
                flex-direction: column;
                justify-content: center;
                padding: 6px 8px;
                gap: 2px;
                min-width: 0;
            }

            .sf-ammo-title {
                font-family: Arial, sans-serif;
                font-size: 12px;
                color: #f4f4f4;
                line-height: 1.1;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .sf-ammo-stat {
                font-family: Arial, sans-serif;
                font-size: 10px;
                color: #d4d4d4;
                line-height: 1.1;
            }

            .sf-btn-wrap {
                position: relative;
                flex-shrink: 0;
                cursor: pointer;
                touch-action: manipulation;
                -webkit-tap-highlight-color: transparent;
                transition: transform 0.12s ease;
            }

            .sf-btn-wrap:hover {
                transform: scale(1.03);
            }

            .sf-btn-wrap.is-pressed {
                transform: scale(0.95);
            }

            .sf-main-ammo-btn {
                width: 50px;
                height: 50px;
                border-radius: 50%;
                position: relative;
                overflow: hidden;
                border: 4px solid #c79437;
                background: radial-gradient(circle at 38% 32%, rgba(255,255,255,0.12) 0%, rgba(26,38,56,0.98) 62%);
                box-shadow:
                    inset 0 0 14px rgba(255,230,160,0.08),
                    0 4px 18px rgba(0,0,0,0.72);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
            }

            .sf-main-ammo-btn::before {
                content: "";
                position: absolute;
                inset: 0;
                border-radius: 50%;
                background: radial-gradient(circle at 34% 28%, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.04) 26%, transparent 58%);
                pointer-events: none;
            }

            .sf-main-ammo-label {
                position: relative;
                z-index: 1;
                font-family: Arial, sans-serif;
                font-size: 16px;
                font-weight: bold;
                line-height: 1;
                text-shadow: 0 0 8px currentColor;
            }

            .sf-main-ammo-count {
                position: relative;
                z-index: 1;
                margin-top: 2px;
                font-family: Arial, sans-serif;
                font-size: 10px;
                color: rgba(255,255,255,0.9);
                line-height: 1;
            }

            .sf-main-ammo-caret {
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

            .sf-active-dot {
                position: absolute;
                top: 5px;
                right: 5px;
                width: 9px;
                height: 9px;
                border-radius: 50%;
                pointer-events: none;
            }

            @media screen and (max-width: 900px) {
                #ammo-bar {
                    right: calc(188px + env(safe-area-inset-right, 0px));
                    bottom: calc(6px + env(safe-area-inset-bottom, 0px));
                    gap: 5px;
                }

                .sf-skills-toggle {
                    width: 44px;
                    height: 44px;
                    font-size: 8px;
                }

                .sf-skill {
                    width: 36px;
                    height: 36px;
                    font-size: 9px;
                }

                .sf-main-ammo-btn {
                    width: 46px;
                    height: 46px;
                }

                .sf-main-ammo-label {
                    font-size: 14px;
                }

                .sf-main-ammo-count {
                    font-size: 13px;
                }

                .sf-ammo-panel {
                    width: min(320px, 82vw);
                    max-height: min(280px, 50vh);
                    top: 50%;
                }

                .sf-ammo-list {
                    max-height: calc(min(280px, 50vh) - 42px);
                }

                .sf-ammo-option {
                    min-height: 54px;
                }

                .sf-ammo-icon-box {
                    width: 50px;
                    min-width: 50px;
                }

                .sf-ammo-icon {
                    width: 32px;
                    height: 32px;
                    font-size: 12px;
                }

                .sf-ammo-title {
                    font-size: 11px;
                }

                .sf-ammo-stat {
                    font-size: 9px;
                }

                .sf-ammo-panel-close {
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

        const bar = document.createElement('div');
        bar.id = 'ammo-bar';

        const skillsWrap = document.createElement('div');
        skillsWrap.className = 'sf-skills-wrap';

        const skillsToggle = document.createElement('div');
        skillsToggle.className = 'sf-skills-toggle';
        skillsToggle.innerHTML = `<span style="font-size:18px;line-height:1;">⚡</span><span style="margin-top:2px;">SKL</span>`;

        const skillsPopup = document.createElement('div');
        skillsPopup.className = 'sf-skills-popup';

        this._skillDefs().forEach(skill => {
            const row = document.createElement('div');
            row.className = 'sf-skills-popup-row';

            const btn = document.createElement('div');
            btn.className = 'sf-skill';
            btn.style.background = `radial-gradient(circle at 38% 32%, rgba(255,255,255,0.10) 0%, ${skill.bg} 62%)`;
            btn.style.color = skill.color;
            btn.textContent = skill.shortLabel;

            const nameEl = document.createElement('span');
            nameEl.className = 'sf-skills-popup-name';
            nameEl.style.color = skill.color;
            nameEl.textContent = skill.fullLabel ?? skill.shortLabel;

            const doSkill = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this._pressFeedback(row);
                skillsPopup.classList.remove('open');
                this.scene.activateSkill?.(skill.key);
            };

            row.dataset.skill = skill.key;
            row.appendChild(btn);
            row.appendChild(nameEl);
            row.addEventListener('click', doSkill);
            row.addEventListener('touchend', doSkill, { passive: false });

            this._skillEls[skill.key] = row;
            skillsPopup.appendChild(row);
        });

        const doToggleSkills = (e) => {
            e.preventDefault();
            e.stopPropagation();
            this._pressFeedback(skillsToggle);
            skillsPopup.classList.toggle('open');
        };
        skillsToggle.addEventListener('click', doToggleSkills);
        skillsToggle.addEventListener('touchend', doToggleSkills, { passive: false });

        skillsWrap.appendChild(skillsToggle);
        skillsWrap.appendChild(skillsPopup);

        const ammoStack = document.createElement('div');
        ammoStack.className = 'sf-ammo-stack';

        const ammoPanel = document.createElement('div');
        ammoPanel.className = 'sf-ammo-panel';

        const panelHeader = document.createElement('div');
        panelHeader.className = 'sf-ammo-panel-header';

        const panelTitle = document.createElement('div');
        panelTitle.className = 'sf-ammo-panel-title';
        panelTitle.textContent = 'Kanonenkugel-Auswahl';

        const panelClose = document.createElement('div');
        panelClose.className = 'sf-ammo-panel-close';
        panelClose.textContent = '✕';

        const doClose = (e) => {
            e.preventDefault();
            e.stopPropagation();
            this._closeAmmoMenu();
        };

        panelClose.addEventListener('click', doClose);
        panelClose.addEventListener('touchend', doClose, { passive: false });

        panelHeader.appendChild(panelTitle);
        panelHeader.appendChild(panelClose);
        ammoPanel.appendChild(panelHeader);

        const list = document.createElement('div');
        list.className = 'sf-ammo-list';

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

        ammoPanel.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true });
        ammoPanel.addEventListener('touchmove', (e) => e.stopPropagation(), { passive: true });
        ammoPanel.addEventListener('touchend', (e) => e.stopPropagation(), { passive: false });

        this._ammoDefs().forEach(ammo => {
            const option = document.createElement('div');
            option.className = `sf-ammo-option${ammo.type === this._activeAmmo ? ' is-active' : ''}`;
            option.dataset.ammo = ammo.type;

            const iconBox = document.createElement('div');
            iconBox.className = 'sf-ammo-icon-box';

            const icon = document.createElement('div');
            icon.className = 'sf-ammo-icon';
            icon.style.color = ammo.color;
            icon.textContent = ammo.short;

            const stock = document.createElement('div');
            stock.className = 'sf-ammo-stock';
            stock.textContent = '∞';

            iconBox.appendChild(icon);
            iconBox.appendChild(stock);

            const info = document.createElement('div');
            info.className = 'sf-ammo-info';

            const title = document.createElement('div');
            title.className = 'sf-ammo-title';
            title.textContent = ammo.label;

            const stat1 = document.createElement('div');
            stat1.className = 'sf-ammo-stat';
            stat1.textContent = `Schaden: ${ammo.damage}`;

            const stat2 = document.createElement('div');
            stat2.className = 'sf-ammo-stat';
            stat2.textContent = `Turmschaden: ${ammo.towerDamage}`;

            info.appendChild(title);
            info.appendChild(stat1);
            info.appendChild(stat2);

            option.appendChild(iconBox);
            option.appendChild(info);

            const chooseAmmo = (e) => {
                if (isScrolling) {
                    e.preventDefault();
                    e.stopPropagation();
                    return;
                }
                e.preventDefault();
                e.stopPropagation();
                this._pressFeedback(option);
                this._setActive(ammo.type);
                this.scene.setAmmoType?.(ammo.type);
                this._closeAmmoMenu();
            };

            option.addEventListener('click', chooseAmmo);
            option.addEventListener('touchend', chooseAmmo, { passive: false });

            this._ammoMenuOptions[ammo.type] = option;
            list.appendChild(option);
        });

        ammoPanel.appendChild(list);
        this._ammoMenuEl = ammoPanel;

        const mainAmmoWrap = document.createElement('div');
        mainAmmoWrap.className = 'sf-btn-wrap';

        const mainAmmoBtn = document.createElement('div');
        mainAmmoBtn.className = 'sf-main-ammo-btn';

        const mainLabel = document.createElement('div');
        mainLabel.className = 'sf-main-ammo-label';

        const mainCount = document.createElement('div');
        mainCount.className = 'sf-main-ammo-count';

        const caret = document.createElement('div');
        caret.className = 'sf-main-ammo-caret';
        caret.textContent = '▲';

        const activeAmmo = this._getAmmoDef(this._activeAmmo);
        mainLabel.textContent = activeAmmo.short;
        mainLabel.style.color = activeAmmo.color;
        mainCount.textContent = '∞';

        mainAmmoBtn.appendChild(mainLabel);
        mainAmmoBtn.appendChild(mainCount);
        mainAmmoBtn.appendChild(caret);
        mainAmmoWrap.appendChild(mainAmmoBtn);
        mainAmmoWrap.appendChild(this._createActiveDot('#d4aa40', activeAmmo.glow));

        const toggleAmmoMenu = (e) => {
            e.preventDefault();
            e.stopPropagation();
            this._pressFeedback(mainAmmoWrap);
            this._toggleAmmoMenu();
        };

        mainAmmoWrap.addEventListener('click', toggleAmmoMenu);
        mainAmmoWrap.addEventListener('touchend', toggleAmmoMenu, { passive: false });

        this._mainAmmoBtn = mainAmmoWrap;

        ammoStack.appendChild(ammoPanel);
        ammoStack.appendChild(mainAmmoWrap);

        bar.appendChild(skillsWrap);
        bar.appendChild(ammoStack);

        document.body.appendChild(bar);
        this._el = bar;
    }

    _createActiveDot(color, glow) {
        const dot = document.createElement('div');
        dot.className = 'sf-active-dot';
        dot.style.background = color;
        dot.style.boxShadow = `0 0 8px ${glow}`;
        return dot;
    }

    _pressFeedback(el) {
        el.classList.add('is-pressed');
        setTimeout(() => el.classList.remove('is-pressed'), 110);
    }

    _getAmmoDef(type) {
        return this._ammoDefs().find(ammo => ammo.type === type) ?? this._ammoDefs()[0];
    }

    _toggleAmmoMenu() {
        this._ammoMenuOpen = !this._ammoMenuOpen;
        this._ammoMenuEl?.classList.toggle('open', this._ammoMenuOpen);

        const caret = this._mainAmmoBtn?.querySelector('.sf-main-ammo-caret');
        if (caret) caret.textContent = this._ammoMenuOpen ? '▼' : '▲';
    }

    _closeAmmoMenu() {
        this._ammoMenuOpen = false;
        this._ammoMenuEl?.classList.remove('open');

        const caret = this._mainAmmoBtn?.querySelector('.sf-main-ammo-caret');
        if (caret) caret.textContent = '▲';
    }

    _setActive(type) {
        this._activeAmmo = type;
        const ammo = this._getAmmoDef(type);

        const mainLabel = this._mainAmmoBtn?.querySelector('.sf-main-ammo-label');
        const mainCount = this._mainAmmoBtn?.querySelector('.sf-main-ammo-count');

        if (mainLabel) {
            mainLabel.textContent = ammo.short;
            mainLabel.style.color = ammo.color;
        }

        if (mainCount) {
            const count = this._getAmmoCount(type);
            mainCount.textContent = count === Infinity || count == null ? '∞' : String(count);
        }

        const mainDot = this._mainAmmoBtn?.querySelector('.sf-active-dot');
        if (mainDot) mainDot.remove();
        this._mainAmmoBtn?.appendChild(this._createActiveDot('#d4aa40', ammo.glow));

        this._ammoDefs().forEach(def => {
            const option = this._ammoMenuOptions[def.type];
            if (!option) return;

            option.classList.toggle('is-active', def.type === type);

            const icon = option.querySelector('.sf-ammo-icon');
            if (icon) icon.style.color = def.color;

            const stock = option.querySelector('.sf-ammo-stock');
            if (stock) {
                const count = this._getAmmoCount(def.type);
                stock.textContent = count === Infinity || count == null ? '∞' : String(count);
            }
        });
    }

    _getAmmoCount(type) {
        const option = this._ammoMenuOptions[type];
        const stock = option?.querySelector('.sf-ammo-stock');
        return stock?.textContent ?? '∞';
    }

    updateAmmoCount(type, count) {
        const option = this._ammoMenuOptions[type];
        if (option) {
            const stock = option.querySelector('.sf-ammo-stock');
            if (stock) stock.textContent = count === Infinity || count == null ? '∞' : String(count);
        }

        if (type === this._activeAmmo) {
            const mainCnt = this._mainAmmoBtn?.querySelector('.sf-main-ammo-count');
            if (mainCnt) {
                mainCnt.textContent = count === Infinity || count == null ? '∞' : String(count);
            }
        }
    }

    updateSkillCooldown(key, remainingMs) {
        const btnWrap = this._skillEls[key];
        if (!btnWrap) return;

        const btn = btnWrap.querySelector('.sf-skill');
        const skill = this._skillDefs().find(s => s.key === key);
        if (!skill || !btn) return;

        const onCooldown = remainingMs > 0;
        btn.textContent = onCooldown ? `${Math.ceil(remainingMs / 1000)}` : skill.shortLabel;
        btn.style.opacity = onCooldown ? '0.45' : '1';
        btn.style.filter = onCooldown ? 'grayscale(0.25)' : 'none';
    }

    setVisible(v) {
        if (this._el) {
            this._el.style.display = v ? 'flex' : 'none';
        }
    }

    destroy() {
        clearTimeout(this._wheelScrollTimer);
        if (this._el?.parentNode) this._el.parentNode.removeChild(this._el);
        this._el = null;
        this._styleEl?.remove();
        this._styleEl = null;
    }
}