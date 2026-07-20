import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'maintenance-contractor-session';
const API_BASE = '/api';

function readStoredSession() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.token || !parsed?.contractor) return null;
    if (parsed.expiresAt && Date.parse(parsed.expiresAt) <= Date.now()) {
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeStoredSession(session) {
  try {
    if (session) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function useContractor() {
  const [session, setSession] = useState(() => readStoredSession());
  const [authChecking, setAuthChecking] = useState(() => Boolean(readStoredSession()?.token));

  useEffect(() => {
    writeStoredSession(session);
  }, [session]);

  useEffect(() => {
    const token = session?.token;
    if (!token) {
      setAuthChecking(false);
      return undefined;
    }

    let cancelled = false;
    setAuthChecking(true);

    fetch(`${API_BASE}/contractor/session`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('Session expired');
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        setSession(data);
      })
      .catch(() => {
        if (cancelled) return;
        setSession(null);
      })
      .finally(() => {
        if (!cancelled) setAuthChecking(false);
      });

    return () => {
      cancelled = true;
    };
    // Only re-validate when token identity changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.token]);

  const login = useCallback(async (username, password) => {
    const res = await fetch(`${API_BASE}/contractor/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Login failed');
    setSession(data);
    return data;
  }, []);

  const clearContractor = useCallback(async () => {
    const token = session?.token;
    setSession(null);
    if (!token) return;
    try {
      await fetch(`${API_BASE}/contractor/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ token }),
      });
    } catch {
      /* ignore */
    }
  }, [session?.token]);

  return {
    session,
    contractor: session?.contractor || '',
    username: session?.username || '',
    company: session?.company || '',
    token: session?.token || '',
    login,
    clearContractor,
    isSignedIn: Boolean(session?.token && session?.contractor),
    authChecking,
  };
}

export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Could not read image'));
    reader.readAsDataURL(file);
  });
}
