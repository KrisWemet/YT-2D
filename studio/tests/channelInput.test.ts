import { describe, expect, it } from 'vitest';
import { parseChannelInput } from '@/lib/core/channelInput';

const ID = 'UCNIZm41qddZf4vV-hjjcjcw';

describe('parseChannelInput', () => {
  it.each([
    [ID, { kind: 'id', id: ID }],
    [`https://www.youtube.com/channel/${ID}`, { kind: 'id', id: ID }],
    [`youtube.com/channel/${ID}/videos`, { kind: 'id', id: ID }],
    ['@kurzgesagt', { kind: 'handle', handle: '@kurzgesagt' }],
    ['kurzgesagt', { kind: 'handle', handle: '@kurzgesagt' }],
    ['https://www.youtube.com/@LifeNoggin', { kind: 'handle', handle: '@LifeNoggin' }],
    ['https://m.youtube.com/@bugsboom-l8p/shorts', { kind: 'handle', handle: '@bugsboom-l8p' }],
    ['https://www.youtube.com/@mastermind__?si=abc', { kind: 'handle', handle: '@mastermind__' }],
    ['https://www.youtube.com/user/TEDEducation', { kind: 'username', username: 'TEDEducation' }],
    ['  @MinuteEarth  ', { kind: 'handle', handle: '@MinuteEarth' }],
  ])('%s', (input, expected) => {
    expect(parseChannelInput(input)).toEqual(expected);
  });

  it.each([
    '',
    'https://www.youtube.com/c/SomeName',
    'https://www.youtube.com/watch?v=abc',
    'https://www.youtube.com/shorts/abc',
    'https://example.com/@someone',
    '@a',
  ])('rejects %j with a reason', (input) => {
    const r = parseChannelInput(input);
    expect(r.kind).toBe('invalid');
    if (r.kind === 'invalid') expect(r.reason.length).toBeGreaterThan(0);
  });
});
