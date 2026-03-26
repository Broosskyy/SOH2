export default class LoginScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LoginScene' });
        this._overlay = null;
        this._mode = 'login';
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

    _getAccounts() {
        try { return JSON.parse(localStorage.getItem('ahc_accounts') || '[]'); } catch { return []; }
    }

    _saveAccounts(accounts) {
        try { localStorage.setItem('ahc_accounts', JSON.stringify(accounts)); } catch {}
    }

    _buildDOM() {
        if (this._overlay) this._destroyDOM();

        const el = document.createElement('div');
        el.id = 'login-overlay';
        el.style.cssText = `
            position: fixed; inset: 0; z-index: 99000;
            display: flex; align-items: center; justify-content: center;
            font-family: Georgia, 'Times New Roman', serif;
            background: radial-gradient(ellipse at center, #0d1b2e 0%, #04080f 100%);
            padding: 12px; overflow: auto;
        `;

        const corners = `
            <div style="position:absolute;top:8px;left:8px;width:18px;height:18px;border:2px solid #b8952a;transform:rotate(45deg);opacity:0.6;"></div>
            <div style="position:absolute;top:8px;right:8px;width:18px;height:18px;border:2px solid #b8952a;transform:rotate(45deg);opacity:0.6;"></div>
            <div style="position:absolute;bottom:8px;left:8px;width:18px;height:18px;border:2px solid #b8952a;transform:rotate(45deg);opacity:0.6;"></div>
            <div style="position:absolute;bottom:8px;right:8px;width:18px;height:18px;border:2px solid #b8952a;transform:rotate(45deg);opacity:0.6;"></div>
        `;

        el.innerHTML = `
            <div style="position:relative;width:100%;max-width:520px;display:flex;flex-direction:column;align-items:stretch;gap:0;">
                <div id="login-card" style="
                    background:linear-gradient(170deg,#0e1d30 0%,#091526 100%);
                    border:2px solid #b8952a; border-radius:4px;
                    padding:32px 28px 24px;
                    box-shadow:0 0 40px rgba(184,149,42,0.15),inset 0 0 60px rgba(0,0,0,0.4);
                    position:relative;
                ">
                    ${corners}
                    <div style="text-align:center;margin-bottom:24px;letter-spacing:4px;font-size:clamp(14px,3vw,22px);color:#d4aa40;text-transform:uppercase;font-style:italic;text-shadow:0 0 20px rgba(212,170,64,0.5);">Azure Horizon Captain</div>

                    <!-- TAB BAR -->
                    <div style="display:flex;gap:0;margin-bottom:20px;border-bottom:1px solid #7a6520;">
                        <button id="tab-login" style="flex:1;padding:8px;background:rgba(212,170,64,0.12);border:none;border-bottom:2px solid #d4aa40;color:#d4aa40;font-family:Georgia,serif;font-size:13px;letter-spacing:1px;cursor:pointer;touch-action:manipulation;">ANMELDUNG</button>
                        <button id="tab-register" style="flex:1;padding:8px;background:transparent;border:none;border-bottom:2px solid transparent;color:#8a7040;font-family:Georgia,serif;font-size:13px;letter-spacing:1px;cursor:pointer;touch-action:manipulation;">REGISTRIERUNG</button>
                    </div>

                    <!-- LOGIN FORM -->
                    <div id="form-login">
                        <div style="border:1px solid #7a6520;background:rgba(0,0,0,0.3);padding:20px 16px;margin-bottom:18px;border-radius:2px;">
                            <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
                                <div style="flex:1;display:flex;align-items:center;border:1px solid #7a6520;background:rgba(10,20,35,0.8);border-radius:2px;overflow:hidden;">
                                    <div style="width:32px;height:32px;display:flex;align-items:center;justify-content:center;color:#b8952a;font-size:16px;">⚓</div>
                                    <input id="login-user" type="text" placeholder="Benutzername" value="" autocomplete="off" autocorrect="off" spellcheck="false" style="flex:1;background:transparent;border:none;outline:none;color:#ddd;font-size:15px;font-family:Georgia,serif;padding:8px 4px;caret-color:#b8952a;"/>
                                </div>
                            </div>
                            <div style="display:flex;align-items:center;border:1px solid #7a6520;background:rgba(10,20,35,0.8);border-radius:2px;overflow:hidden;">
                                <div style="width:32px;height:32px;display:flex;align-items:center;justify-content:center;color:#b8952a;font-size:16px;">🔒</div>
                                <input id="login-pass" type="password" placeholder="Passwort" value="" style="flex:1;background:transparent;border:none;outline:none;color:#ddd;font-size:15px;font-family:Georgia,serif;padding:8px 4px;caret-color:#b8952a;"/>
                            </div>
                        </div>
                        <div style="display:flex;gap:12px;margin-bottom:12px;">
                            <button id="btn-login" style="flex:1;padding:11px 0;background:linear-gradient(135deg,#1a3a1a,#0e260e);border:1px solid #4a8a4a;color:#b8ffb8;font-size:14px;font-family:Georgia,serif;letter-spacing:1px;cursor:pointer;border-radius:2px;touch-action:manipulation;text-transform:uppercase;">Anmelden</button>
                        </div>
                        <div style="text-align:left;">
                            <a id="btn-forgot" href="#" style="color:#a08030;font-size:13px;text-decoration:none;cursor:pointer;">Passwort vergessen?</a>
                        </div>
                    </div>

                    <!-- REGISTER FORM -->
                    <div id="form-register" style="display:none;">
                        <div style="border:1px solid #7a6520;background:rgba(0,0,0,0.3);padding:20px 16px;margin-bottom:18px;border-radius:2px;display:flex;flex-direction:column;gap:10px;">
                            <div style="display:flex;align-items:center;border:1px solid #7a6520;background:rgba(10,20,35,0.8);border-radius:2px;overflow:hidden;">
                                <div style="width:32px;height:32px;display:flex;align-items:center;justify-content:center;color:#b8952a;font-size:14px;">⚓</div>
                                <input id="reg-user" type="text" placeholder="Benutzername (3–20 Zeichen)" autocomplete="off" autocorrect="off" spellcheck="false" style="flex:1;background:transparent;border:none;outline:none;color:#ddd;font-size:14px;font-family:Georgia,serif;padding:8px 4px;caret-color:#b8952a;"/>
                            </div>
                            <div style="display:flex;align-items:center;border:1px solid #7a6520;background:rgba(10,20,35,0.8);border-radius:2px;overflow:hidden;">
                                <div style="width:32px;height:32px;display:flex;align-items:center;justify-content:center;color:#b8952a;font-size:14px;">✉</div>
                                <input id="reg-email" type="email" placeholder="E-Mail Adresse" autocomplete="off" style="flex:1;background:transparent;border:none;outline:none;color:#ddd;font-size:14px;font-family:Georgia,serif;padding:8px 4px;caret-color:#b8952a;"/>
                            </div>
                            <div style="display:flex;align-items:center;border:1px solid #7a6520;background:rgba(10,20,35,0.8);border-radius:2px;overflow:hidden;">
                                <div style="width:32px;height:32px;display:flex;align-items:center;justify-content:center;color:#b8952a;font-size:14px;">🔒</div>
                                <input id="reg-pass" type="password" placeholder="Passwort (min. 6 Zeichen)" style="flex:1;background:transparent;border:none;outline:none;color:#ddd;font-size:14px;font-family:Georgia,serif;padding:8px 4px;caret-color:#b8952a;"/>
                            </div>
                            <div style="display:flex;align-items:center;border:1px solid #7a6520;background:rgba(10,20,35,0.8);border-radius:2px;overflow:hidden;">
                                <div style="width:32px;height:32px;display:flex;align-items:center;justify-content:center;color:#b8952a;font-size:14px;">🔑</div>
                                <input id="reg-pass2" type="password" placeholder="Passwort bestätigen" style="flex:1;background:transparent;border:none;outline:none;color:#ddd;font-size:14px;font-family:Georgia,serif;padding:8px 4px;caret-color:#b8952a;"/>
                            </div>
                        </div>
                        <button id="btn-do-register" style="width:100%;padding:11px 0;background:linear-gradient(135deg,#1a1a3a,#0e0e26);border:1px solid #4a4a8a;color:#b8b8ff;font-size:14px;font-family:Georgia,serif;letter-spacing:1px;cursor:pointer;border-radius:2px;touch-action:manipulation;text-transform:uppercase;margin-bottom:10px;">Konto erstellen</button>
                    </div>

                    <!-- Messages -->
                    <div id="login-error" style="text-align:center;font-size:13px;margin-top:8px;min-height:18px;font-family:Arial,sans-serif;"></div>
                    <div id="login-success" style="text-align:center;font-size:13px;margin-top:8px;min-height:18px;font-family:Arial,sans-serif;color:#7fffb0;display:none;"></div>
                </div>

                <!-- Language flags -->
                <div style="display:flex;justify-content:center;gap:8px;margin-top:16px;flex-wrap:wrap;">
                    ${['🇬🇧','🇹🇷','🇪🇸','🇩🇪','🇮🇹','🇫🇷','🇵🇹','🇵🇱'].map(f => `<span style="font-size:22px;cursor:pointer;opacity:0.85;">${f}</span>`).join('')}
                </div>
            </div>
        `;

        document.body.appendChild(el);
        this._overlay = el;

        const tabLogin    = document.getElementById('tab-login');
        const tabReg      = document.getElementById('tab-register');
        const formLogin   = document.getElementById('form-login');
        const formReg     = document.getElementById('form-register');
        const btnLogin    = document.getElementById('btn-login');
        const btnDoReg    = document.getElementById('btn-do-register');
        const btnForgot   = document.getElementById('btn-forgot');
        const errEl       = document.getElementById('login-error');
        const successEl   = document.getElementById('login-success');

        const showErr = (msg) => { errEl.style.color = '#ff6060'; errEl.textContent = msg; successEl.style.display = 'none'; };
        const showOk  = (msg) => { successEl.textContent = msg; successEl.style.display = 'block'; errEl.textContent = ''; };

        const switchTab = (isLogin) => {
            if (isLogin) {
                formLogin.style.display = ''; formReg.style.display = 'none';
                tabLogin.style.borderBottomColor  = '#d4aa40'; tabLogin.style.color  = '#d4aa40'; tabLogin.style.background  = 'rgba(212,170,64,0.12)';
                tabReg.style.borderBottomColor    = 'transparent'; tabReg.style.color = '#8a7040'; tabReg.style.background = 'transparent';
            } else {
                formLogin.style.display = 'none'; formReg.style.display = '';
                tabReg.style.borderBottomColor    = '#d4aa40'; tabReg.style.color    = '#d4aa40'; tabReg.style.background    = 'rgba(212,170,64,0.12)';
                tabLogin.style.borderBottomColor  = 'transparent'; tabLogin.style.color = '#8a7040'; tabLogin.style.background = 'transparent';
            }
            errEl.textContent = ''; successEl.style.display = 'none';
        };

        tabLogin.addEventListener('click', () => switchTab(true));
        tabReg.addEventListener('click',   () => switchTab(false));

        const doLogin = () => {
            const user = document.getElementById('login-user').value.trim();
            const pass = document.getElementById('login-pass').value;
            if (!user) { showErr('Bitte Benutzernamen eingeben.'); return; }
            const accounts = this._getAccounts();
            if (accounts.length > 0) {
                const found = accounts.find(a => a.username.toLowerCase() === user.toLowerCase() && a.password === pass);
                if (!found) { showErr('Benutzername oder Passwort falsch.'); return; }
            }
            errEl.textContent = '';
            btnLogin.disabled = true;
            btnLogin.textContent = 'Lade...';
            window._loginUsername = user;
            this.time.delayedCall(400, () => this._proceed());
        };

        const doRegister = () => {
            const user  = document.getElementById('reg-user').value.trim();
            const email = document.getElementById('reg-email').value.trim();
            const pass  = document.getElementById('reg-pass').value;
            const pass2 = document.getElementById('reg-pass2').value;

            if (user.length < 3 || user.length > 20) { showErr('Benutzername: 3–20 Zeichen.'); return; }
            if (!/^[a-zA-Z0-9_äöüÄÖÜß]+$/.test(user)) { showErr('Benutzername: nur Buchstaben, Zahlen, _'); return; }
            if (!email.includes('@') || !email.includes('.')) { showErr('Bitte gültige E-Mail eingeben.'); return; }
            if (pass.length < 6) { showErr('Passwort: mindestens 6 Zeichen.'); return; }
            if (pass !== pass2) { showErr('Passwörter stimmen nicht überein.'); return; }

            const accounts = this._getAccounts();
            if (accounts.find(a => a.username.toLowerCase() === user.toLowerCase())) {
                showErr('Benutzername bereits vergeben.'); return;
            }
            accounts.push({ username: user, email, password: pass, createdAt: Date.now() });
            this._saveAccounts(accounts);
            showOk(`✓ Konto "${user}" erstellt! Du kannst dich jetzt anmelden.`);
            setTimeout(() => {
                document.getElementById('login-user').value = user;
                document.getElementById('login-pass').value = pass;
                switchTab(true);
            }, 1200);
        };

        btnLogin.addEventListener('click', doLogin);
        btnLogin.addEventListener('touchend', (e) => { e.preventDefault(); doLogin(); }, { passive: false });
        btnDoReg.addEventListener('click', doRegister);
        btnDoReg.addEventListener('touchend', (e) => { e.preventDefault(); doRegister(); }, { passive: false });
        btnForgot.addEventListener('click', (e) => {
            e.preventDefault();
            const accounts = this._getAccounts();
            showErr(accounts.length ? 'Wende dich an den Support.' : 'Kein Passwort nötig — einfach anmelden!');
        });

        document.getElementById('login-pass')?.addEventListener('keydown', (e) => { if (e.key === 'Enter') doLogin(); });
        document.getElementById('login-user')?.addEventListener('keydown', (e) => { if (e.key === 'Enter') document.getElementById('login-pass').focus(); });
        document.getElementById('reg-pass2')?.addEventListener('keydown', (e) => { if (e.key === 'Enter') doRegister(); });
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
