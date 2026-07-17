const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  listDemoAccounts,
  findAccount,
  createSession,
  getSession,
  destroySession,
  readToken,
  toClientSession,
} = require('./contractorAuth');

describe('contractorAuth', () => {
  it('lists demo accounts without passwords', () => {
    const accounts = listDemoAccounts();
    assert.ok(accounts.length >= 1);
    assert.equal(accounts[0].username, 'coolair');
    assert.equal(accounts[0].assignee, 'CoolAir Cont.');
    assert.equal('password' in accounts[0], false);
  });

  it('finds a valid account (case-insensitive username)', () => {
    const account = findAccount('CoolAir', 'demo123');
    assert.ok(account);
    assert.equal(account.assignee, 'CoolAir Cont.');
  });

  it('rejects bad credentials', () => {
    assert.equal(findAccount('coolair', 'wrong'), undefined);
    assert.equal(findAccount('nobody', 'demo123'), undefined);
    assert.equal(findAccount('', ''), undefined);
  });

  it('creates, reads, and destroys a session', () => {
    const account = findAccount('leo', 'demo123');
    const session = createSession(account);

    assert.ok(session.token);
    assert.equal(session.contractor, 'Leo Fung');
    assert.ok(session.expiresAt > Date.now());

    assert.deepEqual(getSession(session.token), session);

    const client = toClientSession(session);
    assert.equal(client.username, 'leo');
    assert.ok(typeof client.expiresAt === 'string');

    destroySession(session.token);
    assert.equal(getSession(session.token), null);
  });

  it('reads bearer token from request', () => {
    assert.equal(
      readToken({ headers: { authorization: 'Bearer abc123' }, body: {}, query: {} }),
      'abc123'
    );
    assert.equal(
      readToken({ headers: {}, body: { token: 'from-body' }, query: {} }),
      'from-body'
    );
    assert.equal(readToken({ headers: {}, body: {}, query: {} }), '');
  });
});
