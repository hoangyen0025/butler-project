const express = require('express');
const {
  listDemoAccounts,
  findAccount,
  createSession,
  getSession,
  destroySession,
  readToken,
  toClientSession,
} = require('../contractorAuth');

const router = express.Router();

router.get('/accounts', (_req, res) => {
  res.json({
    accounts: listDemoAccounts(),
    hint: 'Demo password for all accounts: demo123',
  });
});

router.post('/login', (req, res) => {
  const username = String(req.body?.username || '').trim();
  const password = String(req.body?.password || '');

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const account = findAccount(username, password);
  if (!account) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const session = createSession(account);
  res.json(toClientSession(session));
});

router.get('/session', (req, res) => {
  const session = getSession(readToken(req));
  if (!session) {
    return res.status(401).json({ error: 'Not signed in' });
  }
  res.json(toClientSession(session));
});

router.post('/logout', (req, res) => {
  destroySession(readToken(req));
  res.json({ ok: true });
});

module.exports = router;
