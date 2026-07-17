import { describe, it, expect } from 'vitest';
import {
  isUrgent,
  isActiveUrgent,
  statusClass,
  priorityClass,
  daysBetween,
  getTicketSla,
  countBy,
  sortByUrgentFirst,
} from './utils';

describe('utils', () => {
  it('detects urgent priorities', () => {
    expect(isUrgent({ priority: 'Critical' })).toBe(true);
    expect(isUrgent({ priority: 'High' })).toBe(true);
    expect(isUrgent({ priority: 'Low' })).toBe(false);
  });

  it('active urgent excludes closed tickets', () => {
    expect(isActiveUrgent({ priority: 'High', status: 'Open' })).toBe(true);
    expect(isActiveUrgent({ priority: 'High', status: 'Closed' })).toBe(false);
  });

  it('builds css class names', () => {
    expect(statusClass('In Progress')).toBe('in-progress');
    expect(priorityClass('Critical')).toBe('critical');
  });

  it('daysBetween counts whole UTC days', () => {
    expect(daysBetween('2024-01-01', '2024-01-04')).toBe(3);
    expect(daysBetween('2024-01-04', '2024-01-01')).toBe(-3);
  });

  it('getTicketSla marks overdue open tickets', () => {
    const sla = getTicketSla(
      {
        created: '2024-01-01',
        dueDate: '2024-01-05',
        status: 'Open',
        priority: 'High',
      },
      '2024-01-10'
    );
    expect(sla.ageDays).toBe(9);
    expect(sla.overdue).toBe(true);
    expect(sla.overdueBy).toBe(5);
    expect(sla.tone).toBe('overdue');
  });

  it('countBy groups ticket fields', () => {
    expect(
      countBy(
        [
          { status: 'Open' },
          { status: 'Open' },
          { status: 'Closed' },
        ],
        'status'
      )
    ).toEqual({ Open: 2, Closed: 1 });
  });

  it('sortByUrgentFirst puts critical/high first', () => {
    const sorted = sortByUrgentFirst([
      { id: 1, priority: 'Low', created: '2024-01-02' },
      { id: 2, priority: 'Critical', created: '2024-01-01' },
      { id: 3, priority: 'High', created: '2024-01-03' },
    ]);
    expect(sorted.map((t) => t.id)).toEqual([2, 3, 1]);
  });
});
