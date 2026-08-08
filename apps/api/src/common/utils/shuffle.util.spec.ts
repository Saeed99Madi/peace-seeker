import { orderPartiesForDisplay, seededShuffle } from './shuffle.util';

describe('display ordering (A-5, §3.1)', () => {
  const items = Array.from({ length: 40 }, (_, index) => index);

  it('keeps one reader’s order stable, so paging does not repeat or skip', () => {
    expect(seededShuffle(items, 'reader-a')).toEqual(seededShuffle(items, 'reader-a'));
  });

  it('gives different readers different orders, so no voice is always first', () => {
    expect(seededShuffle(items, 'reader-a')).not.toEqual(seededShuffle(items, 'reader-b'));
  });

  it('loses nothing and invents nothing', () => {
    expect([...seededShuffle(items, 'seed')].sort((a, b) => a - b)).toEqual(items);
  });

  it('puts neither party first across a run of cases', () => {
    const firstPositions = Array.from({ length: 200 }, (_, index) =>
      orderPartiesForDisplay('alpha', 'beta', `case-${index}`)[0],
    );
    const alphaFirst = firstPositions.filter((side) => side === 'alpha').length;

    // Both orderings must occur; a fixed "Party A on the left" would give 0 or 200.
    expect(alphaFirst).toBeGreaterThan(60);
    expect(alphaFirst).toBeLessThan(140);
  });
});
