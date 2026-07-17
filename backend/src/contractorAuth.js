const crypto = require('crypto');

/** Demo contractor logins → ticket assignee names */
const CONTRACTOR_ACCOUNTS = [
  {
    username: 'coolair',
    password: 'demo123',
    assignee: 'CoolAir Cont.',
    company: 'CoolAir Cont.',
  },
  {
    username: 'greenscape',
    password: 'demo123',
    assignee: 'GreenScape',
    company: 'GreenScape',
  },
  {
    username: 'powerfix',
    password: 'demo123',
    assignee: 'PowerFix HK',
    company: 'PowerFix HK',
  },
  {
    username: 'leo',
    password: 'demo123',
    assignee: 'Leo Fung',
    company: 'Leo Fung',
  },
  {
    username: 'securetech',
    password: 'demo123',
    assignee: 'SecureTech',
    company: 'SecureTech',
  },
  {
    username: 'aquapipe',
    password: 'demo123',
    assignee: 'AquaPipe Co.',
    company: 'AquaPipe Co.',
  },
  {
    username: 'cityplumb',
    password: 'demo123',
    assignee: 'City Plumb',
    company: 'City Plumb',
  },
  {
    username: 'liftcare',
    password: 'demo123',
    assignee: 'LiftCare Asia',
    company: 'LiftCare Asia',
  },
  {
    username: 'firesafe',
    password: 'demo123',
    assignee: 'FireSafe Co.',
    company: 'FireSafe Co.',
  },
  {
    username: 'cleanpro',
    password: 'demo123',
    assignee: 'CleanPro',
    company: 'CleanPro',
  },
];

const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours
const sessions = new Map();

function publicAccount(account) {
  return {
    username: account.username,
    company: account.company,
    assignee: account.assignee,
  };
}

function listDemoAccounts() {
  return CONTRACTOR_ACCOUNTS.map(publicAccount);
}

function findAccount(username, password) {
  const user = String(username || '')
    .trim()
    .toLowerCase();
  const pass = String(password || '');
  return CONTRACTOR_ACCOUNTS.find(
    (account) => account.username === user && account.password === pass
  );
}

function createSession(account) {
  const token = crypto.randomBytes(24).toString('hex');
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const session = {
    token,
    username: account.username,
    contractor: account.assignee,
    company: account.company,
    expiresAt,
  };
  sessions.set(token, session);
  return session;
}

function getSession(token) {
  const key = String(token || '').trim();
  if (!key) return null;
  const session = sessions.get(key);
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    sessions.delete(key);
    return null;
  }
  return session;
}

function destroySession(token) {
  const key = String(token || '').trim();
  if (key) sessions.delete(key);
}

function readToken(req) {
  const header = String(req.headers.authorization || '');
  if (header.toLowerCase().startsWith('bearer ')) {
    return header.slice(7).trim();
  }
  return String(req.body?.token || req.query?.token || '').trim();
}

function toClientSession(session) {
  return {
    token: session.token,
    username: session.username,
    contractor: session.contractor,
    company: session.company,
    expiresAt: new Date(session.expiresAt).toISOString(),
  };
}

module.exports = {
  listDemoAccounts,
  findAccount,
  createSession,
  getSession,
  destroySession,
  readToken,
  toClientSession,
};
