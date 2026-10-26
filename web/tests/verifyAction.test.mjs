import assert from 'node:assert/strict';
import test from 'node:test';
import { prepareVerifyAction } from '../src/lib/verifyAction.js';

test('email verification applies its code immediately', async () => {
  const calls = [];
  const action = await prepareVerifyAction({
    mode: 'verifyEmail',
    oobCode: 'verify-code',
    auth: 'auth-instance',
    checkActionCode: async () => { throw new Error('not used'); },
    applyActionCode: async (auth, code) => calls.push([auth, code]),
  });

  assert.equal(action.kind, 'complete');
  assert.match(action.message, /Email verified/);
  assert.deepEqual(calls, [['auth-instance', 'verify-code']]);
});

test('email change requires an explicit confirmation before applying the code', async () => {
  const calls = [];
  const action = await prepareVerifyAction({
    mode: 'verifyAndChangeEmail',
    oobCode: 'change-code',
    auth: 'auth-instance',
    checkActionCode: async (auth, code) => {
      calls.push(['check', auth, code]);
      return {
        operation: 'VERIFY_AND_CHANGE_EMAIL',
        data: { email: 'new@example.com', previousEmail: 'old@example.com' },
      };
    },
    applyActionCode: async (auth, code) => calls.push(['apply', auth, code]),
  });

  assert.equal(action.kind, 'confirmation');
  assert.match(action.message, /old@example\.com.*new@example\.com/);
  assert.deepEqual(calls, [['check', 'auth-instance', 'change-code']]);
  assert.match(await action.confirm(), /new@example\.com/);
  assert.deepEqual(calls, [
    ['check', 'auth-instance', 'change-code'],
    ['apply', 'auth-instance', 'change-code'],
  ]);
});

test('email change rejects action codes for a different operation', async () => {
  await assert.rejects(prepareVerifyAction({
    mode: 'verifyAndChangeEmail',
    oobCode: 'wrong-code',
    auth: {},
    checkActionCode: async () => ({
      operation: 'VERIFY_EMAIL', data: { email: 'user@example.com' },
    }),
    applyActionCode: async () => assert.fail('must not apply mismatched code'),
  }), /does not match an email change request/);
});

test('email action rejects unsupported modes and missing codes', async () => {
  const deps = {
    auth: {},
    checkActionCode: async () => ({}),
    applyActionCode: async () => {},
  };
  await assert.rejects(prepareVerifyAction({ ...deps, mode: 'resetPassword', oobCode: 'x' }),
    /not an email verification link/);
  await assert.rejects(prepareVerifyAction({ ...deps, mode: 'verifyEmail', oobCode: '' }),
    /missing its code/);
});
