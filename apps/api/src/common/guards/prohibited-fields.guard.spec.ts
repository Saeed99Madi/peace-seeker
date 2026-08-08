import { UnprocessableEntityException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { ProhibitedFieldsGuard } from './prohibited-fields.guard';

function contextWith(body: unknown, query: unknown = {}): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ body, query, method: 'POST', path: '/api/members/me' }),
    }),
  } as unknown as ExecutionContext;
}

/** B-3 — the fields the platform is structurally forbidden from collecting. */
describe('ProhibitedFieldsGuard', () => {
  const guard = new ProhibitedFieldsGuard();

  it('lets an ordinary payload through', () => {
    expect(guard.canActivate(contextWith({ displayName: 'Sami', country: 'LB' }))).toBe(true);
  });

  it('rejects an identity field', () => {
    expect(() => guard.canActivate(contextWith({ religion: 'x' }))).toThrow(
      UnprocessableEntityException,
    );
  });

  it('rejects a precise-location field (S-3)', () => {
    expect(() => guard.canActivate(contextWith({ latitude: 33.9 }))).toThrow(
      UnprocessableEntityException,
    );
  });

  it('finds one nested inside an object', () => {
    expect(() => guard.canActivate(contextWith({ profile: { meta: { ethnicity: 'x' } } }))).toThrow(
      UnprocessableEntityException,
    );
  });

  it('finds one inside an array', () => {
    expect(() => guard.canActivate(contextWith({ items: [{ conflictSide: 'x' }] }))).toThrow(
      UnprocessableEntityException,
    );
  });

  it('rejects a filter attempt on the query string', () => {
    expect(() => guard.canActivate(contextWith({}, { nationality: 'x' }))).toThrow(
      UnprocessableEntityException,
    );
  });

  it('is case-insensitive, so Religion is no different from religion', () => {
    expect(() => guard.canActivate(contextWith({ Religion: 'x' }))).toThrow(
      UnprocessableEntityException,
    );
  });
});
