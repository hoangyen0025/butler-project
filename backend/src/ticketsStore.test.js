const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  parseQueryList,
  matchesAny,
  parsePositiveInt,
  paginateTickets,
  getNeighborIds,
  sortByCreatedDesc,
} = require('./ticketsStore');

describe('ticketsStore helpers', () => {
  it('parseQueryList handles arrays, commas, and empties', () => {
    assert.deepEqual(parseQueryList(undefined), []);
    assert.deepEqual(parseQueryList('Open'), ['Open']);
    assert.deepEqual(parseQueryList(['Open', 'Closed']), ['Open', 'Closed']);
    assert.deepEqual(parseQueryList('Open, In Progress'), ['Open', 'In Progress']);
  });

  it('matchesAny is true when no filter selected', () => {
    assert.equal(matchesAny('Open', []), true);
    assert.equal(matchesAny('Open', ['Open']), true);
    assert.equal(matchesAny('Open', ['Closed']), false);
  });

  it('parsePositiveInt falls back on invalid input', () => {
    assert.equal(parsePositiveInt('3'), 3);
    assert.equal(parsePositiveInt('0', 1), 1);
    assert.equal(parsePositiveInt('abc', 5), 5);
    assert.equal(parsePositiveInt(null, 2), 2);
  });

  it('paginateTickets slices pages correctly', () => {
    const tickets = [1, 2, 3, 4, 5].map((id) => ({ id }));
    const page1 = paginateTickets(tickets, 1, 2);
    assert.deepEqual(
      page1.tickets.map((t) => t.id),
      [1, 2]
    );
    assert.deepEqual(page1.pagination, {
      page: 1,
      limit: 2,
      total: 5,
      totalPages: 3,
    });

    const page3 = paginateTickets(tickets, 3, 2);
    assert.deepEqual(
      page3.tickets.map((t) => t.id),
      [5]
    );

    const all = paginateTickets(tickets, 1, null);
    assert.equal(all.tickets.length, 5);
    assert.equal(all.pagination.totalPages, 1);
  });

  it('getNeighborIds returns prev/next by sorted id', () => {
    const tickets = [{ id: 3 }, { id: 1 }, { id: 2 }];
    assert.deepEqual(getNeighborIds(tickets, 2), { prevId: 1, nextId: 3 });
    assert.deepEqual(getNeighborIds(tickets, 1), { prevId: null, nextId: 2 });
    assert.deepEqual(getNeighborIds(tickets, 99), { prevId: null, nextId: null });
  });

  it('sortByCreatedDesc sorts newest first', () => {
    const sorted = sortByCreatedDesc([
      { id: 1, created: '2024-01-01' },
      { id: 2, created: '2024-03-01' },
      { id: 3, created: '2024-02-01' },
    ]);
    assert.deepEqual(
      sorted.map((t) => t.id),
      [2, 3, 1]
    );
  });
});
