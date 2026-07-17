import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { useContractor } from '../hooks/useContractor';
import '../components/ContractorPortal.css';

const API_BASE = '/api';

export function ContractorPortal() {
  const navigate = useNavigate();
  const { login, isSignedIn, authChecking } = useContractor();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [demoAccounts, setDemoAccounts] = useState([]);
  const [demoHint, setDemoHint] = useState('Demo password: demo123');

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE}/contractor/accounts`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setDemoAccounts(data.accounts || []);
        if (data.hint) setDemoHint(data.hint);
      })
      .catch(() => {
        /* ignore */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!authChecking && isSignedIn) {
    return <Navigate to="/contractor/jobs" replace />;
  }

  const enterPortal = async (event) => {
    event.preventDefault();
    if (!username.trim() || !password) return;

    setError(null);
    setSubmitting(true);
    try {
      await login(username.trim(), password);
      navigate('/contractor/jobs');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemo = (accountUsername) => {
    setUsername(accountUsername);
    setPassword('demo123');
    setError(null);
  };

  return (
    <div className="app app--contractor">
      <Header showSearch={false} totalTickets={0} />
      <main className="main">
        <div className="contractor-gate">
          <p className="contractor-gate__eyebrow">Contractor portal</p>
          <h2 className="contractor-gate__title">Sign in</h2>
          <p className="contractor-gate__copy">
            Log in with your vendor account to see assigned jobs, update status, chat, and
            upload photo evidence.
          </p>

          <form className="contractor-gate__form" onSubmit={enterPortal}>
            <label className="contractor-gate__field">
              <span>Username</span>
              <input
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. coolair"
                disabled={submitting || authChecking}
                required
              />
            </label>
            <label className="contractor-gate__field">
              <span>Password</span>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={submitting || authChecking}
                required
              />
            </label>

            {error && (
              <p className="contractor-gate__error" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="btn btn--primary"
              disabled={submitting || authChecking || !username.trim() || !password}
            >
              {submitting || authChecking ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          {demoAccounts.length > 0 && (
            <div className="contractor-gate__demo">
              <p className="contractor-gate__demo-title">Demo accounts</p>
              <p className="contractor-gate__demo-hint">{demoHint}</p>
              <div className="contractor-gate__demo-list">
                {demoAccounts.map((account) => (
                  <button
                    key={account.username}
                    type="button"
                    className="contractor-gate__demo-chip"
                    onClick={() => fillDemo(account.username)}
                    disabled={submitting}
                  >
                    {account.username}
                  </button>
                ))}
              </div>
            </div>
          )}

          <Link to="/" className="contractor-gate__back">
            ← Back to staff dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}
