import { describe, expect, it } from 'vitest';

import type { SignInFactor } from '@/types';

import { determineStartingSignInFactor, getSignInFactorKey, isFirstFactorCodeSent } from '../signInFactors';

describe('determineStartingSignInFactor', () => {
  describe('with password as the preferred sign in strategy', () => {
    it('selects password if available', () => {
      const factors: SignInFactor[] = [{ strategy: 'password' }];
      expect(determineStartingSignInFactor(factors, null, 'password', false)).toEqual({ strategy: 'password' });
    });

    it('selects based on user input in the previous step if password is not available', () => {
      const factors: SignInFactor[] = [
        { strategy: 'email_code', emailAddressId: 'idn_1', safeIdentifier: 'ccoe@example.com' },
        { strategy: 'phone_code', phoneNumberId: 'idn_2', safeIdentifier: 'jdoe@example.com' },
      ];
      expect(determineStartingSignInFactor(factors, 'jdoe@example.com', 'password', false)).toEqual({
        strategy: 'phone_code',
        phoneNumberId: 'idn_2',
        safeIdentifier: 'jdoe@example.com',
      });
    });

    it('selects by prioritizing email_code if all the above fail', () => {
      const factors: SignInFactor[] = [
        { strategy: 'phone_code', phoneNumberId: 'idn_2', safeIdentifier: 'jdoe@example.com' },
        { strategy: 'email_code', emailAddressId: 'idn_1', safeIdentifier: 'ccoe@example.com' },
      ];
      expect(determineStartingSignInFactor(factors, null, 'password', false)).toEqual({
        strategy: 'email_code',
        emailAddressId: 'idn_1',
        safeIdentifier: 'ccoe@example.com',
      });
    });

    it('selects phone_code if all the above fail', () => {
      const factors: SignInFactor[] = [
        { strategy: 'phone_code', phoneNumberId: 'idn_2', safeIdentifier: 'jdoe@example.com' },
      ];
      expect(determineStartingSignInFactor(factors, null, 'password', false)).toEqual({
        strategy: 'phone_code',
        phoneNumberId: 'idn_2',
        safeIdentifier: 'jdoe@example.com',
      });
    });

    it('returns null if every other scenario', () => {
      expect(determineStartingSignInFactor([], null, 'password', false)).toBeNull();
    });
  });

  describe('with OTP as the preferred sign in strategy', () => {
    it('selects based on user input in the previous step', () => {
      const factors: SignInFactor[] = [
        { strategy: 'password' },
        { strategy: 'email_code', emailAddressId: 'idn_1', safeIdentifier: 'ccoe@example.com' },
        { strategy: 'phone_code', phoneNumberId: 'idn_2', safeIdentifier: 'jdoe@example.com' },
      ];
      expect(determineStartingSignInFactor(factors, 'jdoe@example.com', 'otp', false)).toEqual({
        strategy: 'phone_code',
        phoneNumberId: 'idn_2',
        safeIdentifier: 'jdoe@example.com',
      });
    });

    it('selects by prioritizing email_code if the above fails', () => {
      const factors: SignInFactor[] = [
        { strategy: 'password' },
        { strategy: 'phone_code', phoneNumberId: 'idn_2', safeIdentifier: 'jdoe@example.com' },
        { strategy: 'email_code', emailAddressId: 'idn_1', safeIdentifier: 'ccoe@example.com' },
      ];
      expect(determineStartingSignInFactor(factors, null, 'otp', false)).toEqual({
        strategy: 'email_code',
        emailAddressId: 'idn_1',
        safeIdentifier: 'ccoe@example.com',
      });
    });

    it('selects phone_code if all the above fail', () => {
      const factors: SignInFactor[] = [
        { strategy: 'password' },
        { strategy: 'phone_code', phoneNumberId: 'idn_2', safeIdentifier: 'jdoe@example.com' },
      ];
      expect(determineStartingSignInFactor(factors, null, 'otp', false)).toEqual({
        strategy: 'phone_code',
        phoneNumberId: 'idn_2',
        safeIdentifier: 'jdoe@example.com',
      });
    });

    it('selects password as a last resort if available', () => {
      const factors: SignInFactor[] = [{ strategy: 'password' }];
      expect(determineStartingSignInFactor(factors, null, 'otp', false)).toEqual({ strategy: 'password' });
    });

    it('returns null if every other scenario', () => {
      expect(determineStartingSignInFactor([], null, 'otp', false)).toBeNull();
    });
  });

  it.each(['password', 'otp'] as const)('does not reorder the factors it is given (%s preferred)', preferred => {
    const factors: SignInFactor[] = [
      { strategy: 'phone_code', phoneNumberId: 'idn_2', safeIdentifier: 'jdoe@example.com' },
      { strategy: 'password' },
      { strategy: 'email_code', emailAddressId: 'idn_1', safeIdentifier: 'ccoe@example.com' },
    ];
    const before = [...factors];

    determineStartingSignInFactor(factors, null, preferred, false);

    expect(factors).toEqual(before);
  });
});

describe('getSignInFactorKey', () => {
  it('joins the strategy with the email address id', () => {
    expect(
      getSignInFactorKey({ strategy: 'email_code', emailAddressId: 'idn_1', safeIdentifier: 'a@example.com' }),
    ).toBe('email_code_idn_1');
  });

  it('joins the strategy with the phone number id and channel', () => {
    expect(
      getSignInFactorKey({
        strategy: 'phone_code',
        phoneNumberId: 'idn_2',
        safeIdentifier: '+1555',
        channel: 'whatsapp',
      }),
    ).toBe('phone_code_idn_2_whatsapp');
  });

  it('is the strategy alone when the factor has no identification', () => {
    expect(getSignInFactorKey({ strategy: 'password' })).toBe('password');
  });
});

describe('isFirstFactorCodeSent', () => {
  const phoneA: SignInFactor = { strategy: 'phone_code', phoneNumberId: 'idn_a', safeIdentifier: '+1555000a' };
  const phoneB: SignInFactor = { strategy: 'phone_code', phoneNumberId: 'idn_b', safeIdentifier: '+1555000b' };
  const email: SignInFactor = { strategy: 'email_code', emailAddressId: 'idn_e', safeIdentifier: 'a@example.com' };
  const phonePending = { status: 'unverified' as const, strategy: 'phone_code' };

  it('is sent when a code is pending for the strategy and nothing was prepared in this mount', () => {
    expect(isFirstFactorCodeSent(phonePending, phoneA, null)).toBe(true);
  });

  it('is sent when the last prepared factor is the one shown', () => {
    expect(isFirstFactorCodeSent(phonePending, phoneA, getSignInFactorKey(phoneA))).toBe(true);
  });

  it('is not sent when the code is pending for phone A and phone B is shown', () => {
    expect(isFirstFactorCodeSent(phonePending, phoneB, getSignInFactorKey(phoneA))).toBe(false);
  });

  it('is not sent when the pending code is for another strategy', () => {
    expect(isFirstFactorCodeSent(phonePending, email, null)).toBe(false);
  });

  it('is not sent when the pending code went over another channel', () => {
    const whatsappPending = { status: 'unverified' as const, strategy: 'phone_code', channel: 'whatsapp' as const };
    expect(isFirstFactorCodeSent(whatsappPending, phoneA, null)).toBe(false);
  });

  it('is sent when the pending code went over the channel of the factor shown', () => {
    const whatsappPending = { status: 'unverified' as const, strategy: 'phone_code', channel: 'whatsapp' as const };
    const phoneAWhatsapp: SignInFactor = { ...phoneA, channel: 'whatsapp' };
    expect(isFirstFactorCodeSent(whatsappPending, phoneAWhatsapp, null)).toBe(true);
  });

  it('treats sms and no channel as the same channel', () => {
    const smsPending = { status: 'unverified' as const, strategy: 'phone_code', channel: 'sms' as const };
    const phoneASms: SignInFactor = { ...phoneA, channel: 'sms' };
    expect(isFirstFactorCodeSent(smsPending, phoneA, null)).toBe(true);
    expect(isFirstFactorCodeSent(phonePending, phoneASms, null)).toBe(true);
  });

  it.each([null, 'verified', 'expired', 'failed', 'transferable'] as const)(
    'is not sent when the verification status is %s',
    status => {
      expect(isFirstFactorCodeSent({ status, strategy: 'phone_code' }, phoneA, null)).toBe(false);
    },
  );
});
