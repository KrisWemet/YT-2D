'use client';

import { useActionState } from 'react';
import { sendMagicLink, type LoginState } from './actions';

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(sendMagicLink, { sent: false });
  if (state.sent) {
    return <p className="text-sm text-muted">
        If that&apos;s the owner&apos;s address, a sign-in link is on its way. Open it in this same browser (on a phone, long-press
        the link and choose your browser). Nothing arriving? Check the address and your spam folder, then try again in a few minutes.
      </p>;
  }
  return (
    <form action={action} className="space-y-3">
      <label className="block text-sm font-medium" htmlFor="email">
        Email
      </label>
      <input id="email" name="email" type="email" autoComplete="email" required className="input w-full" />
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? 'Sending…' : 'Send sign-in link'}
      </button>
    </form>
  );
}
