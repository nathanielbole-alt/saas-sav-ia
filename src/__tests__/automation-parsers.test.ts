import { describe, it, expect, vi } from 'vitest'

// Mock supabaseAdmin before importing matchers (which imports it)
vi.mock('@/lib/supabase/admin', () => ({
  supabaseAdmin: {},
}))

import { toConditions, toObject, toString, toNumber, toStringArray, parseTicketPriority, parseTicketStatus, parseTicketPriorities } from '@/lib/automation/parsers'
import { compareValues, matchesConditions } from '@/lib/automation/matchers'

describe('toConditions', () => {
  it('parses valid conditions array', () => {
    const input = [
      { field: 'status', operator: 'equals', value: 'open' },
      { field: 'priority', operator: 'contains', value: 'high' },
    ]
    const result = toConditions(input)
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({ field: 'status', operator: 'equals', value: 'open' })
    expect(result[1]).toEqual({ field: 'priority', operator: 'contains', value: 'high' })
  })

  it('returns empty array for non-array input', () => {
    expect(toConditions('not-an-array')).toEqual([])
    expect(toConditions(42)).toEqual([])
    expect(toConditions(null)).toEqual([])
    expect(toConditions({})).toEqual([])
  })

  it('filters out entries with missing field', () => {
    const input = [
      { field: '', operator: 'equals', value: 'test' },
      { field: 'status', operator: 'equals', value: 'open' },
    ]
    const result = toConditions(input)
    expect(result).toHaveLength(1)
    expect(result[0]!.field).toBe('status')
  })

  it('filters out entries with invalid operator', () => {
    const input = [
      { field: 'status', operator: 'invalid_op', value: 'open' },
      { field: 'status', operator: 'equals', value: 'open' },
    ]
    const result = toConditions(input)
    expect(result).toHaveLength(1)
  })

  it('converts non-string values to string', () => {
    const input = [
      { field: 'count', operator: 'greater_than', value: 42 },
    ]
    const result = toConditions(input)
    expect(result[0]!.value).toBe('42')
  })

  it('converts null value to empty string', () => {
    const input = [
      { field: 'status', operator: 'equals', value: null },
    ]
    const result = toConditions(input)
    expect(result[0]!.value).toBe('')
  })

  it('skips non-object entries in the array', () => {
    const input = [null, 'string', 42, { field: 'status', operator: 'equals', value: 'open' }]
    const result = toConditions(input)
    expect(result).toHaveLength(1)
  })

  it('handles all valid operators', () => {
    const operators = ['equals', 'contains', 'greater_than', 'less_than', 'not_equals']
    operators.forEach((op) => {
      const result = toConditions([{ field: 'x', operator: op, value: 'y' }])
      expect(result).toHaveLength(1)
      expect(result[0]!.operator).toBe(op)
    })
  })
})

describe('compareValues', () => {
  it('equals: case-insensitive comparison', () => {
    expect(compareValues('Open', 'open', 'equals')).toBe(true)
    expect(compareValues('open', 'OPEN', 'equals')).toBe(true)
    expect(compareValues('open', 'closed', 'equals')).toBe(false)
  })

  it('not_equals: case-insensitive', () => {
    expect(compareValues('open', 'closed', 'not_equals')).toBe(true)
    expect(compareValues('open', 'Open', 'not_equals')).toBe(false)
  })

  it('contains: substring match', () => {
    expect(compareValues('hello world', 'world', 'contains')).toBe(true)
    expect(compareValues('hello world', 'WORLD', 'contains')).toBe(true)
    expect(compareValues('hello', 'world', 'contains')).toBe(false)
  })

  it('greater_than: numeric comparison', () => {
    expect(compareValues('10', '5', 'greater_than')).toBe(true)
    expect(compareValues('3', '5', 'greater_than')).toBe(false)
    expect(compareValues('5', '5', 'greater_than')).toBe(false)
  })

  it('less_than: numeric comparison', () => {
    expect(compareValues('3', '5', 'less_than')).toBe(true)
    expect(compareValues('10', '5', 'less_than')).toBe(false)
  })

  it('handles null left value as empty string', () => {
    expect(compareValues(null, 'test', 'equals')).toBe(false)
    expect(compareValues(null, '', 'equals')).toBe(true)
  })

  it('handles undefined left value as empty string', () => {
    expect(compareValues(undefined, '', 'equals')).toBe(true)
  })

  it('falls back to string comparison for non-numeric greater_than/less_than', () => {
    expect(compareValues('b', 'a', 'greater_than')).toBe(true)
    expect(compareValues('a', 'b', 'greater_than')).toBe(false)
  })
})

describe('toObject', () => {
  it('returns the object for a plain object', () => {
    const obj = { key: 'value' }
    expect(toObject(obj)).toBe(obj)
  })

  it('returns empty object for null/undefined', () => {
    expect(toObject(null)).toEqual({})
    expect(toObject(undefined)).toEqual({})
  })

  it('returns empty object for arrays', () => {
    expect(toObject([1, 2])).toEqual({})
  })

  it('returns empty object for primitives', () => {
    expect(toObject('string')).toEqual({})
    expect(toObject(42)).toEqual({})
  })
})

describe('toString', () => {
  it('returns the string if input is string', () => {
    expect(toString('hello')).toBe('hello')
  })

  it('returns fallback for non-strings', () => {
    expect(toString(42, 'default')).toBe('default')
    expect(toString(null, 'default')).toBe('default')
    expect(toString(undefined)).toBe('')
  })
})

describe('toNumber', () => {
  it('returns the number if input is a number', () => {
    expect(toNumber(42, 0)).toBe(42)
  })

  it('parses string numbers', () => {
    expect(toNumber('42', 0)).toBe(42)
  })

  it('returns fallback for non-parseable values', () => {
    expect(toNumber('not-a-number', 99)).toBe(99)
    expect(toNumber(null, 99)).toBe(99)
    expect(toNumber(Infinity, 99)).toBe(99)
  })
})

describe('toStringArray', () => {
  it('filters string entries from arrays', () => {
    expect(toStringArray(['a', 42, 'b', null])).toEqual(['a', 'b'])
  })

  it('splits comma-separated strings', () => {
    expect(toStringArray('a, b, c')).toEqual(['a', 'b', 'c'])
  })

  it('returns empty array for non-string non-array', () => {
    expect(toStringArray(42)).toEqual([])
    expect(toStringArray(null)).toEqual([])
  })
})

describe('parseTicketPriority', () => {
  it('returns valid priority', () => {
    expect(parseTicketPriority('high', 'low')).toBe('high')
    expect(parseTicketPriority('urgent', 'low')).toBe('urgent')
  })

  it('returns fallback for invalid priority', () => {
    expect(parseTicketPriority('invalid', 'medium')).toBe('medium')
    expect(parseTicketPriority(null, 'low')).toBe('low')
  })
})

describe('parseTicketStatus', () => {
  it('returns valid status', () => {
    expect(parseTicketStatus('open', 'closed')).toBe('open')
    expect(parseTicketStatus('resolved', 'open')).toBe('resolved')
  })

  it('returns fallback for invalid status', () => {
    expect(parseTicketStatus('invalid', 'open')).toBe('open')
  })
})

describe('parseTicketPriorities', () => {
  it('filters valid priorities from array', () => {
    expect(parseTicketPriorities(['high', 'invalid', 'low'])).toEqual(['high', 'low'])
  })

  it('parses comma-separated string', () => {
    expect(parseTicketPriorities('high, urgent')).toEqual(['high', 'urgent'])
  })
})
