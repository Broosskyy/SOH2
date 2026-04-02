const express    = require('express');
const http       = require('http');
const { Server } = require('socket.io');
const { Pool }   = require('pg');
const bcrypt     = require('bcrypt');
const path       = require('path');
const crypto     = require('crypto');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
    cors: { origin: '*', methods: ['GET','POST'] },
    pingInterval: 10000,
    pingTimeout:  25000,
});

const PORT = 5000;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
});

/* ══════════════════════════════════════════════════════════════
   SESSION STORE — in-memory (Token → { username, expires })
══════════════════════════════════════════════════════════════ */
const sessions = new Map();
setInterval(() => {
    const now = Date.now();
    for (const [t, s] of sessions) if (s.expires < now) sessions.delete(t);
}, 30 * 60 * 1000);

/* ══════════════════════════════════════════════════════════════
   ONLINE PLAYER STORE — socket.id → Spielerdaten
══════════════════════════════════════════════════════════════ */
const onlinePlayers = new Map();  /* username → { socketId, data } */

/* ══════════════════════════════════════════════════════════════
   DATENBANK SCHEMA
══════════════════════════════════════════════════════════════ */
async function initDB() {
    /* Spielertabelle mit allen MMO-Feldern */
    await pool.query(`
        CREATE TABLE IF NOT EXISTS players (
            id              SERIAL       PRIMARY KEY,
            username        VARCHAR(50)  UNIQUE NOT NULL,
            email           VARCHAR(255) NOT NULL DEFAULT '',
            password_hash   TEXT         NOT NULL,

            /* ── Fortschritt ─────────────────────────────── */
            level           INTEGER      NOT NULL DEFAULT 1,
            xp              BIGINT       NOT NULL DEFAULT 0,
            gold            BIGINT       NOT NULL DEFAULT 0,
            pearls          INTEGER      NOT NULL DEFAULT 0,
            rank_points     INTEGER      NOT NULL DEFAULT 0,
            reputation      INTEGER      NOT NULL DEFAULT 0,
            bounty          INTEGER      NOT NULL DEFAULT 0,

            /* ── Kampf-Statistiken ───────────────────────── */
            total_kills     INTEGER      NOT NULL DEFAULT 0,
            pve_kills       INTEGER      NOT NULL DEFAULT 0,
            pvp_kills       INTEGER      NOT NULL DEFAULT 0,
            deaths          INTEGER      NOT NULL DEFAULT 0,
            damage_dealt    BIGINT       NOT NULL DEFAULT 0,
            damage_received BIGINT       NOT NULL DEFAULT 0,
            shots_fired     INTEGER      NOT NULL DEFAULT 0,
            shots_hit       INTEGER      NOT NULL DEFAULT 0,
            longest_streak  INTEGER      NOT NULL DEFAULT 0,
            treasure_found  INTEGER      NOT NULL DEFAULT 0,

            /* ── Spielzeit & Session ─────────────────────── */
            playtime_mins   INTEGER      NOT NULL DEFAULT 0,
            login_count     INTEGER      NOT NULL DEFAULT 0,
            last_login      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
            last_online     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

            /* ── Schiff ──────────────────────────────────── */
            ship_class      VARCHAR(50)  NOT NULL DEFAULT 'sloop',
            ship_name       VARCHAR(100) NOT NULL DEFAULT '',
            cannon_tier     INTEGER      NOT NULL DEFAULT 0,

            /* ── MMO Welt-Position ───────────────────────── */
            chart_id        INTEGER      NOT NULL DEFAULT 1,
            pos_x           FLOAT        NOT NULL DEFAULT 0.5,
            pos_y           FLOAT        NOT NULL DEFAULT 0.5,
            pvp_mode        BOOLEAN      NOT NULL DEFAULT false,

            /* ── Account-Status ──────────────────────────── */
            is_admin        BOOLEAN      NOT NULL DEFAULT false,
            is_gm           BOOLEAN      NOT NULL DEFAULT false,
            is_banned       BOOLEAN      NOT NULL DEFAULT false,
            ban_reason      TEXT         NOT NULL DEFAULT '',
            ban_until       TIMESTAMPTZ,

            /* ── JSON Datenblöcke (bestehend) ────────────── */
            game_data       JSONB        NOT NULL DEFAULT '{}',
            ship_data       JSONB        NOT NULL DEFAULT '{}',
            upgrades        JSONB        NOT NULL DEFAULT '{}',
            trial_data      JSONB        NOT NULL DEFAULT '{}',
            achievements    JSONB        NOT NULL DEFAULT '{}',
            login_streak    JSONB        NOT NULL DEFAULT '{}',
            guild_data      JSONB        NOT NULL DEFAULT '{}',

            created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
            updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
        )
    `);

    /* Neue Spalten sicher hinzufügen falls sie noch nicht existieren */
    const newCols = [
        `ALTER TABLE players ADD COLUMN IF NOT EXISTS level           INTEGER NOT NULL DEFAULT 1`,
        `ALTER TABLE players ADD COLUMN IF NOT EXISTS xp              BIGINT  NOT NULL DEFAULT 0`,
        `ALTER TABLE players ADD COLUMN IF NOT EXISTS gold            BIGINT  NOT NULL DEFAULT 0`,
        `ALTER TABLE players ADD COLUMN IF NOT EXISTS pearls          INTEGER NOT NULL DEFAULT 0`,
        `ALTER TABLE players ADD COLUMN IF NOT EXISTS rank_points     INTEGER NOT NULL DEFAULT 0`,
        `ALTER TABLE players ADD COLUMN IF NOT EXISTS reputation      INTEGER NOT NULL DEFAULT 0`,
        `ALTER TABLE players ADD COLUMN IF NOT EXISTS bounty          INTEGER NOT NULL DEFAULT 0`,
        `ALTER TABLE players ADD COLUMN IF NOT EXISTS total_kills     INTEGER NOT NULL DEFAULT 0`,
        `ALTER TABLE players ADD COLUMN IF NOT EXISTS pve_kills       INTEGER NOT NULL DEFAULT 0`,
        `ALTER TABLE players ADD COLUMN IF NOT EXISTS pvp_kills       INTEGER NOT NULL DEFAULT 0`,
        `ALTER TABLE players ADD COLUMN IF NOT EXISTS deaths          INTEGER NOT NULL DEFAULT 0`,
        `ALTER TABLE players ADD COLUMN IF NOT EXISTS damage_dealt    BIGINT  NOT NULL DEFAULT 0`,
        `ALTER TABLE players ADD COLUMN IF NOT EXISTS damage_received BIGINT  NOT NULL DEFAULT 0`,
        `ALTER TABLE players ADD COLUMN IF NOT EXISTS shots_fired     INTEGER NOT NULL DEFAULT 0`,
        `ALTER TABLE players ADD COLUMN IF NOT EXISTS shots_hit       INTEGER NOT NULL DEFAULT 0`,
        `ALTER TABLE players ADD COLUMN IF NOT EXISTS longest_streak  INTEGER NOT NULL DEFAULT 0`,
        `ALTER TABLE players ADD COLUMN IF NOT EXISTS treasure_found  INTEGER NOT NULL DEFAULT 0`,
        `ALTER TABLE players ADD COLUMN IF NOT EXISTS playtime_mins   INTEGER NOT NULL DEFAULT 0`,
        `ALTER TABLE players ADD COLUMN IF NOT EXISTS login_count     INTEGER NOT NULL DEFAULT 0`,
        `ALTER TABLE players ADD COLUMN IF NOT EXISTS last_login      TIMESTAMPTZ NOT NULL DEFAULT NOW()`,
        `ALTER TABLE players ADD COLUMN IF NOT EXISTS last_online     TIMESTAMPTZ NOT NULL DEFAULT NOW()`,
        `ALTER TABLE players ADD COLUMN IF NOT EXISTS ship_class      VARCHAR(50)  NOT NULL DEFAULT 'sloop'`,
        `ALTER TABLE players ADD COLUMN IF NOT EXISTS ship_name       VARCHAR(100) NOT NULL DEFAULT ''`,
        `ALTER TABLE players ADD COLUMN IF NOT EXISTS chart_id        INTEGER NOT NULL DEFAULT 1`,
        `ALTER TABLE players ADD COLUMN IF NOT EXISTS pos_x           FLOAT   NOT NULL DEFAULT 0.5`,
        `ALTER TABLE players ADD COLUMN IF NOT EXISTS pos_y           FLOAT   NOT NULL DEFAULT 0.5`,
        `ALTER TABLE players ADD COLUMN IF NOT EXISTS pvp_mode        BOOLEAN NOT NULL DEFAULT false`,
        `ALTER TABLE players ADD COLUMN IF NOT EXISTS is_admin        BOOLEAN NOT NULL DEFAULT false`,
        `ALTER TABLE players ADD COLUMN IF NOT EXISTS is_gm           BOOLEAN NOT NULL DEFAULT false`,
        `ALTER TABLE players ADD COLUMN IF NOT EXISTS is_banned       BOOLEAN NOT NULL DEFAULT false`,
        `ALTER TABLE players ADD COLUMN IF NOT EXISTS ban_reason      TEXT    NOT NULL DEFAULT ''`,
        `ALTER TABLE players ADD COLUMN IF NOT EXISTS ban_until       TIMESTAMPTZ`,
    ];
    for (const sql of newCols) {
        try { await pool.query(sql); } catch (_) {}
    }

    /* Index für schnelle Online-Abfragen */
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_players_username_lower ON players (LOWER(username))`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_players_last_online    ON players (last_online DESC)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_players_rank_points    ON players (rank_points DESC)`);

    console.log('[DB] Schema bereit (MMO-Edition)');
}

/* ══════════════════════════════════════════════════════════════
   MIDDLEWARE
══════════════════════════════════════════════════════════════ */
app.use(express.json({ limit: '4mb' }));
app.use((req, res, next) => {
    if (req.path.endsWith('.js') || req.path.endsWith('.mjs')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
    }
    next();
});
app.use(express.static(path.join(__dirname, '.')));

function requireAuth(req, res, next) {
    const auth  = req.headers['authorization'] ?? '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    const session = sessions.get(token);
    if (!session || session.expires < Date.now()) {
        return res.status(401).json({ error: 'Nicht autorisiert' });
    }
    session.expires = Date.now() + 7 * 24 * 3600 * 1000;
    req.username = session.username;
    next();
}

/* ══════════════════════════════════════════════════════════════
   AUTH ROUTES
══════════════════════════════════════════════════════════════ */
app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body ?? {};
    if (!username || !password)
        return res.status(400).json({ error: 'Benutzername und Passwort erforderlich' });
    if (username.length < 3 || username.length > 50)
        return res.status(400).json({ error: 'Benutzername: 3–50 Zeichen' });
    if (password.length < 6)
        return res.status(400).json({ error: 'Passwort: mindestens 6 Zeichen' });
    if (!/^[a-zA-Z0-9_\-]+$/.test(username))
        return res.status(400).json({ error: 'Nur Buchstaben, Zahlen, _ und - erlaubt' });
    try {
        const hash = await bcrypt.hash(password, 10);
        await pool.query(
            `INSERT INTO players (username, email, password_hash, login_count, last_login)
             VALUES ($1, $2, $3, 1, NOW())`,
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
    if (!username || !password)
        return res.status(400).json({ error: 'Benutzername und Passwort erforderlich' });
    try {
        const result = await pool.query(
            `SELECT id, username, password_hash, is_banned, ban_reason, ban_until, is_admin, is_gm
             FROM players WHERE LOWER(username) = LOWER($1)`,
            [username]
        );
        if (!result.rows.length)
            return res.status(401).json({ error: 'Benutzername oder Passwort falsch' });

        const player = result.rows[0];
        const ok = await bcrypt.compare(password, player.password_hash);
        if (!ok) return res.status(401).json({ error: 'Benutzername oder Passwort falsch' });

        if (player.is_banned) {
            const until = player.ban_until ? ` bis ${new Date(player.ban_until).toLocaleDateString('de')}` : ' (permanent)';
            return res.status(403).json({ error: `Account gesperrt${until}: ${player.ban_reason}` });
        }

        /* Login-Zähler & Zeitstempel aktualisieren */
        await pool.query(
            `UPDATE players SET login_count = login_count + 1, last_login = NOW(), last_online = NOW()
             WHERE id = $1`,
            [player.id]
        );

        const token = crypto.randomBytes(32).toString('hex');
        sessions.set(token, {
            username: player.username,
            expires:  Date.now() + 7 * 24 * 3600 * 1000
        });
        res.json({
            ok: true, token,
            username: player.username,
            isAdmin:  player.is_admin,
            isGM:     player.is_gm,
        });
    } catch (e) {
        console.error('[login]', e.message);
        res.status(500).json({ error: 'Serverfehler beim Anmelden' });
    }
});

app.post('/api/logout', requireAuth, (req, res) => {
    const token = (req.headers['authorization'] ?? '').slice(7);
    sessions.delete(token);
    onlinePlayers.delete(req.username);
    io.emit('player:left', { username: req.username });
    res.json({ ok: true });
});

app.get('/api/me', requireAuth, async (req, res) => {
    try {
        const r = await pool.query(
            `SELECT id, username, level, xp, gold, pearls, rank_points, reputation, bounty,
                    total_kills, pve_kills, pvp_kills, deaths, longest_streak, treasure_found,
                    playtime_mins, login_count, ship_class, ship_name, cannon_tier,
                    chart_id, pos_x, pos_y, pvp_mode, is_admin, is_gm, created_at, last_login
             FROM players WHERE LOWER(username) = LOWER($1)`,
            [req.username]
        );
        if (!r.rows.length) return res.status(404).json({ error: 'Spieler nicht gefunden' });
        res.json({ ok: true, player: r.rows[0] });
    } catch (e) {
        res.status(500).json({ error: 'Fehler' });
    }
});

/* ══════════════════════════════════════════════════════════════
   SPIELSTAND SPEICHERN / LADEN
══════════════════════════════════════════════════════════════ */
app.post('/api/save', requireAuth, async (req, res) => {
    const {
        gameData, shipData, upgrades, trialData,
        achievements, loginStreak, guildData, cannonTier,
        /* Neue MMO-Felder */
        level, xp, gold, pearls, rankPoints, reputation, bounty,
        totalKills, pveKills, pvpKills, deaths, damageDealt, damageReceived,
        shotsFired, shotsHit, longestStreak, treasureFound,
        playtimeMins, shipClass, shipName, chartId, posX, posY, pvpMode,
    } = req.body ?? {};
    try {
        await pool.query(`
            UPDATE players SET
                game_data       = COALESCE($1,  game_data),
                ship_data       = COALESCE($2,  ship_data),
                upgrades        = COALESCE($3,  upgrades),
                trial_data      = COALESCE($4,  trial_data),
                achievements    = COALESCE($5,  achievements),
                login_streak    = COALESCE($6,  login_streak),
                guild_data      = COALESCE($7,  guild_data),
                cannon_tier     = COALESCE($8,  cannon_tier),
                level           = COALESCE($9,  level),
                xp              = COALESCE($10, xp),
                gold            = COALESCE($11, gold),
                pearls          = COALESCE($12, pearls),
                rank_points     = COALESCE($13, rank_points),
                reputation      = COALESCE($14, reputation),
                bounty          = COALESCE($15, bounty),
                total_kills     = COALESCE($16, total_kills),
                pve_kills       = COALESCE($17, pve_kills),
                pvp_kills       = COALESCE($18, pvp_kills),
                deaths          = COALESCE($19, deaths),
                damage_dealt    = COALESCE($20, damage_dealt),
                damage_received = COALESCE($21, damage_received),
                shots_fired     = COALESCE($22, shots_fired),
                shots_hit       = COALESCE($23, shots_hit),
                longest_streak  = COALESCE($24, longest_streak),
                treasure_found  = COALESCE($25, treasure_found),
                playtime_mins   = COALESCE($26, playtime_mins),
                ship_class      = COALESCE($27, ship_class),
                ship_name       = COALESCE($28, ship_name),
                chart_id        = COALESCE($29, chart_id),
                pos_x           = COALESCE($30, pos_x),
                pos_y           = COALESCE($31, pos_y),
                pvp_mode        = COALESCE($32, pvp_mode),
                last_online     = NOW(),
                updated_at      = NOW()
            WHERE LOWER(username) = LOWER($33)
        `, [
            gameData    ? JSON.stringify(gameData)    : null,
            shipData    ? JSON.stringify(shipData)    : null,
            upgrades    ? JSON.stringify(upgrades)    : null,
            trialData   ? JSON.stringify(trialData)   : null,
            achievements? JSON.stringify(achievements): null,
            loginStreak ? JSON.stringify(loginStreak) : null,
            guildData   ? JSON.stringify(guildData)   : null,
            cannonTier  ?? null,
            level       ?? null,
            xp          ?? null,
            gold        ?? null,
            pearls      ?? null,
            rankPoints  ?? null,
            reputation  ?? null,
            bounty      ?? null,
            totalKills  ?? null,
            pveKills    ?? null,
            pvpKills    ?? null,
            deaths      ?? null,
            damageDealt ?? null,
            damageReceived ?? null,
            shotsFired  ?? null,
            shotsHit    ?? null,
            longestStreak ?? null,
            treasureFound ?? null,
            playtimeMins ?? null,
            shipClass   ?? null,
            shipName    ?? null,
            chartId     ?? null,
            posX        ?? null,
            posY        ?? null,
            pvpMode     ?? null,
            req.username,
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
                   achievements, login_streak, guild_data, cannon_tier,
                   level, xp, gold, pearls, rank_points, reputation, bounty,
                   total_kills, pve_kills, pvp_kills, deaths, damage_dealt,
                   damage_received, shots_fired, shots_hit, longest_streak,
                   treasure_found, playtime_mins, login_count, ship_class, ship_name,
                   chart_id, pos_x, pos_y, pvp_mode, is_admin, is_gm
            FROM players WHERE LOWER(username) = LOWER($1)
        `, [req.username]);
        if (!result.rows.length)
            return res.status(404).json({ error: 'Spieler nicht gefunden' });
        res.json({ ok: true, data: result.rows[0] });
    } catch (e) {
        console.error('[load]', e.message);
        res.status(500).json({ error: 'Laden fehlgeschlagen' });
    }
});

/* ══════════════════════════════════════════════════════════════
   ONLINE SPIELER & WELT
══════════════════════════════════════════════════════════════ */
app.get('/api/online', requireAuth, (req, res) => {
    const list = [];
    for (const [username, entry] of onlinePlayers) {
        list.push({
            username,
            level:    entry.level   ?? 1,
            pvpMode:  entry.pvpMode ?? false,
            chartId:  entry.chartId ?? 1,
            posX:     entry.posX    ?? 0.5,
            posY:     entry.posY    ?? 0.5,
            shipClass: entry.shipClass ?? 'sloop',
            guild:    entry.guild   ?? '',
        });
    }
    res.json({ ok: true, count: list.length, players: list });
});

/* ══════════════════════════════════════════════════════════════
   RANGLISTE / LEADERBOARD
══════════════════════════════════════════════════════════════ */
app.get('/api/leaderboard', async (req, res) => {
    const type = req.query.type ?? 'rank';
    const orderMap = {
        rank:     'rank_points DESC',
        kills:    'total_kills DESC',
        pvp:      'pvp_kills DESC',
        level:    'level DESC, xp DESC',
        gold:     'gold DESC',
        treasure: 'treasure_found DESC',
        playtime: 'playtime_mins DESC',
    };
    const order = orderMap[type] ?? orderMap.rank;
    try {
        const r = await pool.query(`
            SELECT username, level, gold, rank_points, total_kills, pvp_kills,
                   pve_kills, deaths, longest_streak, treasure_found, playtime_mins,
                   ship_class, guild_data, last_online, created_at
            FROM players
            WHERE is_banned = false
            ORDER BY ${order}
            LIMIT 100
        `);
        res.json({ ok: true, leaderboard: r.rows });
    } catch (e) {
        res.status(500).json({ error: 'Fehler' });
    }
});

/* ══════════════════════════════════════════════════════════════
   SPIELER-PROFIL (öffentlich)
══════════════════════════════════════════════════════════════ */
app.get('/api/player/:username', async (req, res) => {
    try {
        const r = await pool.query(`
            SELECT username, level, xp, gold, rank_points, reputation, bounty,
                   total_kills, pve_kills, pvp_kills, deaths, longest_streak,
                   treasure_found, playtime_mins, login_count, ship_class, ship_name,
                   guild_data, created_at, last_online
            FROM players WHERE LOWER(username) = LOWER($1) AND is_banned = false
        `, [req.params.username]);
        if (!r.rows.length) return res.status(404).json({ error: 'Spieler nicht gefunden' });
        res.json({ ok: true, player: r.rows[0] });
    } catch (e) {
        res.status(500).json({ error: 'Fehler' });
    }
});

/* ══════════════════════════════════════════════════════════════
   ADMIN ROUTES
══════════════════════════════════════════════════════════════ */
async function requireAdmin(req, res, next) {
    const r = await pool.query(
        'SELECT is_admin FROM players WHERE LOWER(username) = LOWER($1)', [req.username]
    );
    if (!r.rows[0]?.is_admin) return res.status(403).json({ error: 'Kein Admin' });
    next();
}

app.get('/api/admin/players', requireAuth, requireAdmin, async (req, res) => {
    const { search = '', page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    try {
        const r = await pool.query(`
            SELECT id, username, email, level, xp, gold, rank_points,
                   total_kills, pvp_kills, deaths, playtime_mins, login_count,
                   is_admin, is_gm, is_banned, ban_reason, ban_until,
                   created_at, last_online, last_login
            FROM players
            WHERE username ILIKE $1
            ORDER BY created_at DESC
            LIMIT $2 OFFSET $3
        `, [`%${search}%`, limit, offset]);
        const count = await pool.query(
            `SELECT COUNT(*) FROM players WHERE username ILIKE $1`, [`%${search}%`]
        );
        res.json({ ok: true, players: r.rows, total: parseInt(count.rows[0].count) });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/admin/ban', requireAuth, requireAdmin, async (req, res) => {
    const { username, reason = 'Kein Grund angegeben', banUntil = null } = req.body ?? {};
    if (!username) return res.status(400).json({ error: 'Username erforderlich' });
    try {
        await pool.query(
            `UPDATE players SET is_banned = true, ban_reason = $1, ban_until = $2
             WHERE LOWER(username) = LOWER($3)`,
            [reason, banUntil, username]
        );
        /* Online-Spieler rauswerfen */
        const entry = onlinePlayers.get(username);
        if (entry?.socketId) {
            const sock = io.sockets.sockets.get(entry.socketId);
            sock?.emit('banned', { reason });
            sock?.disconnect(true);
        }
        onlinePlayers.delete(username);
        io.emit('player:left', { username });
        res.json({ ok: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/admin/unban', requireAuth, requireAdmin, async (req, res) => {
    const { username } = req.body ?? {};
    try {
        await pool.query(
            `UPDATE players SET is_banned = false, ban_reason = '', ban_until = NULL
             WHERE LOWER(username) = LOWER($1)`, [username]
        );
        res.json({ ok: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/admin/set-role', requireAuth, requireAdmin, async (req, res) => {
    const { username, isAdmin, isGM } = req.body ?? {};
    try {
        await pool.query(
            `UPDATE players SET is_admin = $1, is_gm = $2 WHERE LOWER(username) = LOWER($3)`,
            [!!isAdmin, !!isGM, username]
        );
        res.json({ ok: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/admin/give-gold', requireAuth, requireAdmin, async (req, res) => {
    const { username, amount } = req.body ?? {};
    try {
        await pool.query(
            `UPDATE players SET gold = gold + $1 WHERE LOWER(username) = LOWER($2)`,
            [amount, username]
        );
        res.json({ ok: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

/* ══════════════════════════════════════════════════════════════
   SOCKET.IO — ECHTZEIT MULTIPLAYER
══════════════════════════════════════════════════════════════ */
io.use((socket, next) => {
    /* Token-Auth beim Verbindungsaufbau */
    const token   = socket.handshake.auth?.token ?? '';
    const session = sessions.get(token);
    if (!session || session.expires < Date.now()) {
        return next(new Error('Nicht autorisiert'));
    }
    session.expires = Date.now() + 7 * 24 * 3600 * 1000;
    socket.username = session.username;
    next();
});

io.on('connection', async (socket) => {
    const username = socket.username;
    console.log(`[WS] ${username} verbunden (${socket.id})`);

    /* Bereits verbundene Session mit diesem Account trennen (kein Doppel-Login) */
    const existing = onlinePlayers.get(username);
    if (existing?.socketId && existing.socketId !== socket.id) {
        const oldSock = io.sockets.sockets.get(existing.socketId);
        if (oldSock) {
            oldSock.emit('kicked', { reason: 'Neues Gerät hat sich eingeloggt.' });
            oldSock.disconnect(true);
        }
        onlinePlayers.delete(username);
        console.log(`[WS] ${username} alte Session getrennt (Doppel-Login)`);
    }

    /* Spielerdaten aus DB laden */
    let playerRow;
    try {
        const r = await pool.query(
            `SELECT level, gold, pearls, rank_points, pvp_mode, chart_id,
                    pos_x, pos_y, ship_class, ship_name, guild_data
             FROM players WHERE LOWER(username) = LOWER($1)`,
            [username]
        );
        playerRow = r.rows[0] ?? {};
    } catch (e) {
        playerRow = {};
    }

    /* In Online-Map eintragen */
    onlinePlayers.set(username, {
        socketId:  socket.id,
        username,
        level:     playerRow.level    ?? 1,
        pvpMode:   playerRow.pvp_mode ?? false,
        chartId:   playerRow.chart_id ?? 1,
        posX:      playerRow.pos_x    ?? 0.5,
        posY:      playerRow.pos_y    ?? 0.5,
        shipClass: playerRow.ship_class ?? 'sloop',
        shipName:  playerRow.ship_name  ?? '',
        guild:     playerRow.guild_data?.tag ?? '',
        hp:        100,
        maxHp:     100,
        lastSeen:  Date.now(),
    });

    /* Allen anderen den Neuzugang melden */
    socket.broadcast.emit('player:joined', {
        username,
        ...onlinePlayers.get(username),
    });

    /* Dem Spieler die aktuelle Weltkarte schicken */
    const worldSnapshot = [];
    for (const [u, d] of onlinePlayers) {
        if (u !== username) worldSnapshot.push({ username: u, ...d });
    }
    socket.emit('world:snapshot', { players: worldSnapshot });

    /* ── Position & Status Update ─────────────────────────── */
    let lastMoveAt = 0;
    socket.on('player:move', (data) => {
        const now = Date.now();
        if (now - lastMoveAt < 100) return; /* Max 10/s */
        lastMoveAt = now;

        const entry = onlinePlayers.get(username);
        if (!entry) return;

        entry.posX    = typeof data.posX   === 'number' ? Math.max(0, Math.min(1, data.posX))  : entry.posX;
        entry.posY    = typeof data.posY   === 'number' ? Math.max(0, Math.min(1, data.posY))  : entry.posY;
        entry.chartId = typeof data.chartId === 'number' ? data.chartId : entry.chartId;
        entry.pvpMode = typeof data.pvpMode === 'boolean' ? data.pvpMode : entry.pvpMode;
        entry.hp      = typeof data.hp     === 'number' ? data.hp     : entry.hp;
        entry.lastSeen = now;

        /* Nur Spieler auf der gleichen Karte bekommen das Update */
        for (const [u, d] of onlinePlayers) {
            if (u !== username && d.chartId === entry.chartId) {
                const s = io.sockets.sockets.get(d.socketId);
                s?.emit('player:updated', { username, posX: entry.posX, posY: entry.posY,
                    pvpMode: entry.pvpMode, hp: entry.hp, chartId: entry.chartId });
            }
        }
    });

    /* ── PvP Treffer ──────────────────────────────────────── */
    socket.on('pvp:hit', async (data) => {
        const { targetUsername, damage } = data ?? {};
        if (!targetUsername || !damage) return;

        const targetEntry = onlinePlayers.get(targetUsername);
        if (!targetEntry) return;
        if (!targetEntry.pvpMode) return; /* Nur im PvP-Modus treffbar */

        const dmg = Math.min(Math.max(Math.round(damage), 1), 500);
        targetEntry.hp = Math.max(0, (targetEntry.hp ?? 100) - dmg);

        /* Ziel benachrichtigen */
        const targetSock = io.sockets.sockets.get(targetEntry.socketId);
        targetSock?.emit('pvp:hit', {
            attackerUsername: username,
            damage: dmg,
            hpRemaining: targetEntry.hp,
        });

        /* Statistiken in DB aktualisieren */
        try {
            await pool.query(
                `UPDATE players SET damage_dealt = damage_dealt + $1 WHERE LOWER(username) = LOWER($2)`,
                [dmg, username]
            );
            await pool.query(
                `UPDATE players SET damage_received = damage_received + $1 WHERE LOWER(username) = LOWER($2)`,
                [dmg, targetUsername]
            );

            if (targetEntry.hp <= 0) {
                /* Kill registrieren */
                await pool.query(
                    `UPDATE players SET pvp_kills = pvp_kills + 1, total_kills = total_kills + 1,
                                        rank_points = rank_points + 25
                     WHERE LOWER(username) = LOWER($1)`,
                    [username]
                );
                await pool.query(
                    `UPDATE players SET deaths = deaths + 1 WHERE LOWER(username) = LOWER($1)`,
                    [targetUsername]
                );
                targetSock?.emit('pvp:killed', { killerUsername: username });
                socket.emit('pvp:kill_confirmed', { targetUsername, xpGained: 120, goldGained: 50 });
                /* HP Reset */
                targetEntry.hp = 100;
            }
        } catch (e) {
            console.error('[pvp:hit DB]', e.message);
        }
    });

    /* ── PvE Kill (Spieler meldet NPC-Kill) ───────────────── */
    socket.on('pve:kill', async (data) => {
        const { npcTier = 1, xpGained = 0, goldGained = 0 } = data ?? {};
        try {
            await pool.query(
                `UPDATE players SET
                    pve_kills   = pve_kills + 1,
                    total_kills = total_kills + 1,
                    xp          = xp + $1,
                    gold        = gold + $2
                 WHERE LOWER(username) = LOWER($3)`,
                [Math.min(xpGained, 10000), Math.min(goldGained, 100000), username]
            );
        } catch (e) {
            console.error('[pve:kill DB]', e.message);
        }
    });

    /* ── Chat ─────────────────────────────────────────────── */
    socket.on('chat:send', (data) => {
        const msg = (data?.message ?? '').trim().slice(0, 200);
        if (!msg) return;
        io.emit('chat:message', {
            username,
            message: msg,
            timestamp: Date.now(),
        });
    });

    /* ── PvP-Modus wechseln ───────────────────────────────── */
    socket.on('player:setMode', (data) => {
        const entry = onlinePlayers.get(username);
        if (!entry) return;
        entry.pvpMode = !!data?.pvpMode;
        socket.broadcast.emit('player:modeChanged', { username, pvpMode: entry.pvpMode });
    });

    /* ── Disconnect ───────────────────────────────────────── */
    socket.on('disconnect', async () => {
        console.log(`[WS] ${username} getrennt`);
        onlinePlayers.delete(username);
        io.emit('player:left', { username });

        /* Letzte Position in DB speichern */
        try {
            await pool.query(
                `UPDATE players SET last_online = NOW() WHERE LOWER(username) = LOWER($1)`,
                [username]
            );
        } catch (_) {}
    });
});

/* Spieler die länger als 5min keine Positionsupdate geschickt haben als offline markieren */
setInterval(() => {
    const cutoff = Date.now() - 5 * 60 * 1000;
    for (const [username, entry] of onlinePlayers) {
        if (entry.lastSeen < cutoff) {
            onlinePlayers.delete(username);
            io.emit('player:left', { username });
        }
    }
}, 60 * 1000);

/* ══════════════════════════════════════════════════════════════
   FALLBACK SPA ROUTE
══════════════════════════════════════════════════════════════ */
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

/* ══════════════════════════════════════════════════════════════
   START
══════════════════════════════════════════════════════════════ */
initDB()
    .then(() => {
        server.listen(PORT, '0.0.0.0', () => {
            console.log(`[AHC] MMO-Server läuft auf Port ${PORT}`);
        });
    })
    .catch(e => {
        console.error('[DB INIT FEHLER]', e.message);
        process.exit(1);
    });
