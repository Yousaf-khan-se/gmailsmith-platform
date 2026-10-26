const VERIFY_MODES = new Set(['verifyEmail', 'verifyAndChangeEmail']);
const CHANGE_OPERATIONS = new Set([
  'VERIFY_AND_CHANGE_EMAIL',
  'verifyAndChangeEmail',
]);

export async function prepareVerifyAction({
  mode,
  oobCode,
  auth,
  checkActionCode,
  applyActionCode,
}) {
  if (!VERIFY_MODES.has(mode)) {
    throw new Error('This link is not an email verification link. Open the link from your inbox instead.');
  }
  if (!oobCode) {
    throw new Error('The link is missing its code. Request a new verification email from the app.');
  }

  if (mode === 'verifyEmail') {
    await applyActionCode(auth, oobCode);
    return {
      kind: 'complete',
      message: 'Email verified. Return to GmailSmith and choose “I’ve verified — continue.”',
    };
  }

  const action = await checkActionCode(auth, oobCode);
  if (action.operation && !CHANGE_OPERATIONS.has(action.operation)) {
    throw new Error('This link does not match an email change request.');
  }
  const newEmail = action.data && action.data.email;
  const oldEmail = action.data && action.data.previousEmail;
  return {
    kind: 'confirmation',
    message: `Confirm changing ${oldEmail || 'your GmailSmith account'} to ${newEmail || 'the new email address'}.`,
    async confirm() {
      await applyActionCode(auth, oobCode);
      return `Email changed to ${newEmail || 'the new address'}. Return to GmailSmith and choose “I’ve verified — continue.”`;
    },
  };
}
