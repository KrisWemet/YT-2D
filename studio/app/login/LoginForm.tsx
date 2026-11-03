'use client';

import { useActionState } from 'react';
import { sendMagicLink, type LoginState } from './actions';

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(sendMagicLink, { sent: false });
  if (state.sent) {
    return <p className="text-sm text-muted">Check your email for a sign-in link. Open it on this device.</p>;
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
