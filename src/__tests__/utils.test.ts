import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  toRecord,
  extractGmailReplyContext,
  timeAgo,
  getCustomerName,
} from '@/lib/utils'

describe('toRecord', () => {
  it('returns the object for a plain object', () => {
    const obj = { a: 1, b: 'two' }
    expect(toRecord(obj)).toBe(obj)
  })

  it('returns null for null', () => {
    expect(toRecord(null)).toBeNull()
  })

  it('returns null for undefined', () => {
    expect(toRecord(undefined)).toBeNull()
  })

  it('returns null for arrays', () => {
    expect(toRecord([1, 2, 3])).toBeNull()
  })

  it('returns null for primitives', () => {
    expect(toRecord('string')).toBeNull()
    expect(toRecord(42)).toBeNull()
    expect(toRecord(true)).toBeNull()
  })
})

describe('getCustomerName', () => {
  it('returns full_name when present', () => {
    expect(getCustomerName({ full_name: 'Jean Dupont', email: 'jean@test.com' })).toBe(
      'Jean Dupont'
    )
  })

  it('returns email when full_name is null', () => {
    expect(getCustomerName({ full_name: null, email: 'jean@test.com' })).toBe(
      'jean@test.com'
    )
  })

  it('returns empty full_name over email (falsy but not null)', () => {
    // empty string is falsy but not null, so ?? returns it
    expect(getCustomerName({ full_name: '', email: 'jean@test.com' })).toBe('')
  })
})

describe('extractGmailReplyContext', () => {
  it('extracts threadId and messageId from metadata', () => {
    const result = extractGmailReplyContext({
      gmail_thread_id: 'thread-123',
      gmail_message_id_header: '<msg-456@mail.gmail.com>',
    })
    expect(result).toEqual({
      threadId: 'thread-123',
      inReplyToMessageId: '<msg-456@mail.gmail.com>',
    })
  })

  it('falls back to in_reply_to_message_id', () => {
    const result = extractGmailReplyContext({
      gmail_thread_id: 'thread-1',
      in_reply_to_message_id: '<fallback@gmail.com>',
    })
    expect(result.inReplyToMessageId).toBe('<fallback@gmail.com>')
  })

  it('falls back to message_id', () => {
    const result = extractGmailReplyContext({
      gmail_thread_id: 'thread-1',
      message_id: '<last-resort@gmail.com>',
    })
    expect(result.inReplyToMessageId).toBe('<last-resort@gmail.com>')
  })

  it('returns nulls for non-object metadata', () => {
    expect(extractGmailReplyContext(null)).toEqual({
      threadId: null,
      inReplyToMessageId: null,
    })
    expect(extractGmailReplyContext('string')).toEqual({
      threadId: null,
      inReplyToMessageId: null,
    })
    expect(extractGmailReplyContext(42)).toEqual({
      threadId: null,
      inReplyToMessageId: null,
    })
  })

  it('returns nulls for empty object', () => {
    expect(extractGmailReplyContext({})).toEqual({
      threadId: null,
      inReplyToMessageId: null,
    })
  })
})

describe('timeAgo', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns "à l\'instant" for less than 1 minute', () => {
    const now = new Date()
    expect(timeAgo(now.toISOString())).toBe("à l'instant")
  })

  it('returns minutes for less than 1 hour', () => {
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000)
    expect(timeAgo(thirtyMinsAgo.toISOString())).toBe('30m')
  })

  it('returns hours for less than 1 day', () => {
    const fiveHoursAgo = new Date(Date.now() - 5 * 60 * 60 * 1000)
    expect(timeAgo(fiveHoursAgo.toISOString())).toBe('5h')
  })

  it('returns days for 1+ days', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    expect(timeAgo(threeDaysAgo.toISOString())).toBe('3j')
  })
})
