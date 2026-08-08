import { attributionFor, cardSafeFields, firstNameOf } from './attribution.util';

describe('attribution (A-6, A-7)', () => {
  describe('firstNameOf', () => {
    it('takes the leading token of a multi-part name', () => {
      expect(firstNameOf('Maryam Al-Sayed')).toBe('Maryam');
    });

    it('returns a single-token name unchanged (I-5: no assumed name structure)', () => {
      expect(firstNameOf('Aisha')).toBe('Aisha');
      expect(firstNameOf('مريم')).toBe('مريم');
    });
  });

  describe('attributionFor', () => {
    it('shows the full name only when that mode was chosen', () => {
      expect(attributionFor('Maryam Al-Sayed', 'NAME', 'JO')).toEqual({
        kind: 'name',
        value: 'Maryam Al-Sayed',
      });
    });

    it('defaults to first name only', () => {
      expect(attributionFor('Maryam Al-Sayed', 'FIRST_NAME', 'JO').value).toBe('Maryam');
    });

    it('drops the name entirely when anonymous', () => {
      expect(attributionFor('Maryam Al-Sayed', 'ANONYMOUS', 'JO')).toEqual({
        kind: 'anonymousFromCountry',
        value: 'JO',
      });
    });

    it('is simply "a voice" when anonymous with no country', () => {
      expect(attributionFor('Maryam', 'ANONYMOUS', null)).toEqual({
        kind: 'anonymous',
        value: null,
      });
    });
  });

  describe('cardSafeFields', () => {
    it('never puts a country on a card unless that is the whole attribution', () => {
      const named = cardSafeFields(attributionFor('Maryam Al-Sayed', 'NAME', 'JO'));
      expect(named.country).toBeNull();
    });

    it('carries neither name nor country for a fully anonymous voice', () => {
      const anonymous = cardSafeFields(attributionFor('Maryam', 'ANONYMOUS', null));
      expect(anonymous).toEqual({ name: null, country: null });
    });
  });
});
