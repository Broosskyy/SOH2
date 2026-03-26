export default class LoginScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LoginScene' });
        this._overlay = null;
    }

    create() {
        const { width, height } = this.scale;

        this.cameras.main.setBackgroundColor('#080c14');

        this._drawBg(width, height);
        this._buildDOM();

        this.scale.on('resize', (gameSize) => {
            this._redraw(gameSize.width, gameSize.height);
        });
    }

    _drawBg(w, h) {
        const g = this.add.graphics();
        g.fillStyle(0x04080f, 1);
        g.fillRect(0, 0, w, h);

        for (let i = 0; i < 80; i++) {
            const x = Phaser.Math.Between(0, w);
            const y = Phaser.Math.Between(0, h);
            const alpha = Phaser.Math.FloatBetween(0.2, 0.7);
            const size = Phaser.Math.FloatBetween(0.5, 2);
            g.fillStyle(0xffffff, alpha);
            g.fillCircle(x, y, size);
        }
        this._bg = g;
    }

    _redraw(w, h) {
        if (this._bg) this._bg.destroy();
        this._drawBg(w, h);
    }

    _buildDOM() {
        if (this._overlay) this._destroyDOM();

        const tips = [
            'Melde dich immer ab, bevor du das Spiel schließt!',
            'Sammle Ressourcen, um dein Schiff zu verbessern.',
            'Im Kampf: Wähle die richtige Munition für jeden Feind.',
            'Erkunde alle 10 Seekarten für seltene Beute.',
        ];

        const el = document.createElement('div');
        el.id = 'login-overlay';
        el.style.cssText = `
            position: fixed;
            inset: 0;
            z-index: 99000;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: Georgia, 'Times New Roman', serif;
            background: radial-gradient(ellipse at center, #0d1b2e 0%, #04080f 100%);
            padding: 12px;
            overflow: auto;
        `;

        el.innerHTML = `
            <div style="
                position: relative;
                width: 100%;
                max-width: 520px;
                display: flex;
                flex-direction: column;
                align-items: stretch;
                gap: 0;
            ">
                <!-- Main login card -->
                <div id="login-card" style="
                    background: linear-gradient(170deg, #0e1d30 0%, #091526 100%);
                    border: 2px solid #b8952a;
                    border-radius: 4px;
                    padding: 32px 28px 24px;
                    box-shadow: 0 0 40px rgba(184,149,42,0.15), inset 0 0 60px rgba(0,0,0,0.4);
                    position: relative;
                ">
                    <!-- Corner diamonds -->
                    <div style="position:absolute;top:8px;left:8px;width:18px;height:18px;border:2px solid #b8952a;transform:rotate(45deg);opacity:0.6;"></div>
                    <div style="position:absolute;top:8px;right:8px;width:18px;height:18px;border:2px solid #b8952a;transform:rotate(45deg);opacity:0.6;"></div>
                    <div style="position:absolute;bottom:8px;left:8px;width:18px;height:18px;border:2px solid #b8952a;transform:rotate(45deg);opacity:0.6;"></div>
                    <div style="position:absolute;bottom:8px;right:8px;width:18px;height:18px;border:2px solid #b8952a;transform:rotate(45deg);opacity:0.6;"></div>

                    <!-- Title -->
                    <div style="
                        text-align: center;
                        margin-bottom: 28px;
                        letter-spacing: 4px;
                        font-size: clamp(14px, 3vw, 22px);
                        color: #d4aa40;
                        text-transform: uppercase;
                        font-style: italic;
                        text-shadow: 0 0 20px rgba(212,170,64,0.5);
                    ">Azure Horizon Captain</div>

                    <!-- Inner input area -->
                    <div style="
                        border: 1px solid #7a6520;
                        background: rgba(0,0,0,0.3);
                        padding: 20px 16px;
                        margin-bottom: 18px;
                        border-radius: 2px;
                    ">
                        <!-- Username row -->
                        <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
                            <div style="
                                flex:1;
                                display:flex;
                                align-items:center;
                                border:1px solid #7a6520;
                                background:rgba(10,20,35,0.8);
                                border-radius:2px;
                                overflow:hidden;
                            ">
                                <div style="
                                    width:32px;height:32px;display:flex;align-items:center;justify-content:center;
                                    color:#b8952a;font-size:16px;flex-shrink:0;padding:0 4px;
                                ">⚓</div>
                                <input id="login-user" type="text" placeholder="Benutzername" value="Kapitän" autocomplete="off" autocorrect="off" spellcheck="false" style="
                                    flex:1;
                                    background:transparent;
                                    border:none;
                                    outline:none;
                                    color:#ddd;
                                    font-size:15px;
                                    font-family:Georgia,serif;
                                    padding:8px 4px;
                                    caret-color:#b8952a;
                                "/>
                            </div>
                            <button id="login-user-btn" style="
                                width:36px;height:36px;
                                background:linear-gradient(135deg,#1e6b3e,#145230);
                                border:1px solid #3aa870;
                                border-radius:2px;
                                color:#fff;font-size:16px;
                                cursor:pointer;
                                display:flex;align-items:center;justify-content:center;
                                flex-shrink:0;
                                touch-action:manipulation;
                            ">📋</button>
                        </div>

                        <!-- Password row -->
                        <div style="
                            display:flex;align-items:center;
                            border:1px solid #7a6520;
                            background:rgba(10,20,35,0.8);
                            border-radius:2px;
                            overflow:hidden;
                        ">
                            <div style="
                                width:32px;height:32px;display:flex;align-items:center;justify-content:center;
                                color:#b8952a;font-size:16px;flex-shrink:0;padding:0 4px;
                            ">🔒</div>
                            <input id="login-pass" type="password" placeholder="Passwort" value="demo1234" style="
                                flex:1;
                                background:transparent;
                                border:none;
                                outline:none;
                                color:#ddd;
                                font-size:15px;
                                font-family:Georgia,serif;
                                padding:8px 4px;
                                caret-color:#b8952a;
                            "/>
                        </div>
                    </div>

                    <!-- Buttons -->
                    <div style="display:flex;gap:12px;margin-bottom:12px;">
                        <button id="btn-login" style="
                            flex:1;
                            padding:11px 0;
                            background:linear-gradient(135deg,#1a3a1a,#0e260e);
                            border:1px solid #4a8a4a;
                            color:#b8ffb8;
                            font-size:14px;
                            font-family:Georgia,serif;
                            letter-spacing:1px;
                            cursor:pointer;
                            border-radius:2px;
                            touch-action:manipulation;
                            transition:background 0.2s;
                            text-transform:uppercase;
                        ">Anmeldung</button>
                        <button id="btn-register" style="
                            flex:1;
                            padding:11px 0;
                            background:linear-gradient(135deg,#1a1a3a,#0e0e26);
                            border:1px solid #4a4a8a;
                            color:#b8b8ff;
                            font-size:14px;
                            font-family:Georgia,serif;
                            letter-spacing:1px;
                            cursor:pointer;
                            border-radius:2px;
                            touch-action:manipulation;
                            transition:background 0.2s;
                            text-transform:uppercase;
                        ">Neu registrieren</button>
                    </div>

                    <!-- Forgot -->
                    <div style="text-align:left;">
                        <a id="btn-forgot" href="#" style="
                            color:#a08030;
                            font-size:13px;
                            text-decoration:none;
                            letter-spacing:0.5px;
                            cursor:pointer;
                            touch-action:manipulation;
                        ">Ich habe vergessen !</a>
                    </div>
                </div>

                <!-- Language flags -->
                <div style="
                    display:flex;
                    justify-content:center;
                    gap:8px;
                    margin-top:16px;
                    flex-wrap:wrap;
                ">
                    ${['🇬🇧','🇹🇷','🇪🇸','🇩🇪','🇮🇹','🇫🇷','🇵🇹','🇵🇱'].map(f =>
                        `<span style="font-size:22px;cursor:pointer;touch-action:manipulation;opacity:0.85;">${f}</span>`
                    ).join('')}
                </div>

                <!-- Error msg -->
                <div id="login-error" style="
                    text-align:center;color:#ff6060;font-size:13px;
                    margin-top:10px;min-height:18px;font-family:Arial,sans-serif;
                "></div>
            </div>
        `;

        document.body.appendChild(el);
        this._overlay = el;

        const btnLogin    = document.getElementById('btn-login');
        const btnRegister = document.getElementById('btn-register');
        const btnForgot   = document.getElementById('btn-forgot');
        const userInput   = document.getElementById('login-user');
        const passInput   = document.getElementById('login-pass');
        const errEl       = document.getElementById('login-error');

        const doLogin = () => {
            const user = userInput.value.trim();
            if (!user) {
                errEl.textContent = 'Bitte Benutzernamen eingeben.';
                return;
            }
            errEl.textContent = '';
            btnLogin.disabled = true;
            btnLogin.textContent = 'Lade...';
            window._loginUsername = user;
            this.time.delayedCall(400, () => this._proceed());
        };

        btnLogin.addEventListener('click', doLogin);
        btnLogin.addEventListener('touchend', (e) => { e.preventDefault(); doLogin(); }, { passive: false });
        btnRegister.addEventListener('click', () => {
            errEl.textContent = 'Registrierung: Benutzernamen eingeben und "Anmeldung" klicken.';
        });
        btnRegister.addEventListener('touchend', (e) => { e.preventDefault(); errEl.textContent = 'Registrierung: Benutzernamen eingeben und "Anmeldung" klicken.'; }, { passive: false });
        btnForgot.addEventListener('click', (e) => { e.preventDefault(); errEl.textContent = 'Passwort vergessen? Einfach weiterspielen!'; });

        passInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') doLogin(); });
        userInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') passInput.focus(); });

        btnLogin.addEventListener('mouseover', () => { btnLogin.style.background = 'linear-gradient(135deg,#245024,#18381e)'; });
        btnLogin.addEventListener('mouseout',  () => { btnLogin.style.background = 'linear-gradient(135deg,#1a3a1a,#0e260e)'; });
    }

    _proceed() {
        this._destroyDOM();
        this.scene.start('LoadingScene');
    }

    _destroyDOM() {
        if (this._overlay?.parentNode) {
            this._overlay.parentNode.removeChild(this._overlay);
            this._overlay = null;
        }
    }

    shutdown() { this._destroyDOM(); }
    destroy()  { this._destroyDOM(); }
}
