const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = 5000;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
});

const sessions = new Map();

app.use(express.json({ limit: '4mb' }));
app.use(express.static(path.join(__dirname, '.')));

async function initDB() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS players (
            id              SERIAL PRIMARY KEY,
            username        VARCHAR(50)  UNIQUE NOT NULL,
            email           VARCHAR(255) NOT NULL DEFAULT '',
            password_hash   TEXT         NOT NULL,
            game_data       JSONB        NOT NULL DEFAULT '{}',
            ship_data       JSONB        NOT NULL DEFAULT '{}',
            upgrades        JSONB        NOT NULL DEFAULT '{}',
            trial_data      JSONB        NOT NULL DEFAULT '{}',
            achievements    JSONB        NOT NULL DEFAULT '{}',
            login_streak    JSONB        NOT NULL DEFAULT '{}',
            guild_data      JSONB        NOT NULL DEFAULT '{}',
            cannon_tier     INTEGER      NOT NULL DEFAULT 0,
            created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
            updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
        )
    `);
    console.log('[DB] Schema bereit');
}

function cleanSessions() {
    const now = Date.now();
    for (const [token, session] of sessions) {
        if (session.expires < now) sessions.delete(token);
    }
}
setInterval(cleanSessions, 30 * 60 * 1000);

function requireAuth(req, res, next) {
    const auth = req.headers['authorization'] ?? '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    const session = sessions.get(token);
    if (!session || session.expires < Date.now()) {
        return res.status(401).json({ error: 'Nicht autorisiert' });
    }
    session.expires = Date.now() + 7 * 24 * 3600 * 1000;
    req.username = session.username;
    next();
}

app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body ?? {};
    if (!username || !password) {
        return res.status(400).json({ error: 'Benutzername und Passwort erforderlich' });
    }
    if (username.length < 3 || username.length > 50) {
        return res.status(400).json({ error: 'Benutzername: 3–50 Zeichen' });
    }
    if (password.length < 6) {
        return res.status(400).json({ error: 'Passwort: mindestens 6 Zeichen' });
    }
    try {
        const hash = await bcrypt.hash(password, 10);
        await pool.query(
            'INSERT INTO players (username, email, password_hash) VALUES ($1, $2, $3)',
            [username, email ?? '', hash]
        );
        res.json({ ok: true, message: `Konto "${username}" erstellt!` });
    } catch (e) {
        if (e.code === '23505') return res.status(409).json({ error: 'Benutzername bereits vergeben' });
        console.error('[register]', e.message);
        res.status(500).json({ error: 'Serverfehler beim Registrieren' });
    }
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body ?? {};
    if (!username || !password) {
        return res.status(400).json({ error: 'Benutzername und Passwort erforderlich' });
    }
    try {
        const result = await pool.query(
            'SELECT id, username, password_hash FROM players WHERE LOWER(username) = LOWER($1)',
            [username]
        );
        if (!result.rows.length) {
            return res.status(401).json({ error: 'Benutzername oder Passwort falsch' });
        }
        const player = result.rows[0];
        const ok = await bcrypt.compare(password, player.password_hash);
        if (!ok) return res.status(401).json({ error: 'Benutzername oder Passwort falsch' });

        const token = crypto.randomBytes(32).toString('hex');
        sessions.set(token, {
            username: player.username,
            expires: Date.now() + 7 * 24 * 3600 * 1000
        });
        res.json({ ok: true, token, username: player.username });
    } catch (e) {
        console.error('[login]', e.message);
        res.status(500).json({ error: 'Serverfehler beim Anmelden' });
    }
});

app.get('/api/me', requireAuth, (req, res) => {
    res.json({ ok: true, username: req.username });
});

app.post('/api/save', requireAuth, async (req, res) => {
    const {
        gameData, shipData, upgrades, trialData,
        achievements, loginStreak, guildData, cannonTier
    } = req.body ?? {};
    try {
        await pool.query(`
            UPDATE players SET
                game_data    = $1,
                ship_data    = $2,
                upgrades     = $3,
                trial_data   = $4,
                achievements = $5,
                login_streak = $6,
                guild_data   = $7,
                cannon_tier  = $8,
                updated_at   = NOW()
            WHERE LOWER(username) = LOWER($9)
        `, [
            gameData    ?? {},
            shipData    ?? {},
            upgrades    ?? {},
            trialData   ?? {},
            achievements ?? {},
            loginStreak ?? {},
            guildData   ?? {},
            cannonTier  ?? 0,
            req.username
        ]);
        res.json({ ok: true });
    } catch (e) {
        console.error('[save]', e.message);
        res.status(500).json({ error: 'Speichern fehlgeschlagen' });
    }
});

app.get('/api/load', requireAuth, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT game_data, ship_data, upgrades, trial_data,
                   achievements, login_streak, guild_data, cannon_tier
            FROM players WHERE LOWER(username) = LOWER($1)
        `, [req.username]);
        if (!result.rows.length) {
            return res.status(404).json({ error: 'Spieler nicht gefunden' });
        }
        res.json({ ok: true, data: result.rows[0] });
    } catch (e) {
        console.error('[load]', e.message);
        res.status(500).json({ error: 'Laden fehlgeschlagen' });
    }
});

app.post('/api/logout', requireAuth, (req, res) => {
    const auth = req.headers['authorization'] ?? '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    sessions.delete(token);
    res.json({ ok: true });
});

app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

initDB()
    .then(() => {
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`[AHC] Server läuft auf Port ${PORT}`);
        });
    })
    .catch(e => {
        console.error('[DB INIT FEHLER]', e.message);
        process.exit(1);
    });
