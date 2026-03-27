const SESSION_KEY = 'ahc_token';

let _token   = null;
let _username = null;

function _restoreSession() {
    if (_token) return;
    try {
        _token    = sessionStorage.getItem(SESSION_KEY) ?? null;
        _username = sessionStorage.getItem('ahc_session_user') ?? null;
    } catch {}
}

export function setAuth(token, username) {
    _token    = token    ?? null;
    _username = username ?? null;
    try {
        if (_token) {
            sessionStorage.setItem(SESSION_KEY, _token);
            sessionStorage.setItem('ahc_session_user', _username ?? '');
        } else {
            sessionStorage.removeItem(SESSION_KEY);
            sessionStorage.removeItem('ahc_session_user');
        }
    } catch {}
}

export function getToken()    { _restoreSession(); return _token;    }
export function getUsername() { _restoreSession(); return _username ?? window._loginUsername ?? null; }
export function isLoggedIn()  { _restoreSession(); return !!_token;  }

async function _apiFetch(path, options = {}) {
    _restoreSession();
    const headers = { 'Content-Type': 'application/json', ...(options.headers ?? {}) };
    if (_token) headers['Authorization'] = `Bearer ${_token}`;
    const res = await fetch(path, { ...options, headers });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
    return json;
}

export async function apiRegister(username, email, password) {
    return _apiFetch('/api/register', {
        method: 'POST',
        body: JSON.stringify({ username, email, password })
    });
}

export async function apiLogin(username, password) {
    const result = await _apiFetch('/api/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
    });
    if (result.ok && result.token) {
        setAuth(result.token, result.username);
    }
    return result;
}

export async function apiCheckToken() {
    _restoreSession();
    if (!_token) return false;
    try {
        const r = await _apiFetch('/api/me');
        return !!r.ok;
    } catch {
        setAuth(null, null);
        return false;
    }
}

export async function apiLoad() {
    _restoreSession();
    if (!_token) return null;
    try {
        const r = await _apiFetch('/api/load');
        return r.ok ? r.data : null;
    } catch (e) {
        console.warn('[API] Load fehlgeschlagen:', e.message);
        return null;
    }
}

export async function apiSave(payload) {
    _restoreSession();
    if (!_token) return false;
    try {
        await _apiFetch('/api/save', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        return true;
    } catch (e) {
        console.warn('[API] Save fehlgeschlagen:', e.message);
        return false;
    }
}

export async function apiLogout() {
    _restoreSession();
    if (!_token) return;
    try {
        await _apiFetch('/api/logout', { method: 'POST' });
    } catch {}
    setAuth(null, null);
}
