'use client';

import { useActionState } from 'react';
import { addChannel, importSeedAction, syncNowAction, type ActionState } from './actions';

function Result({ state }: { state: ActionState }) {
  if (!state.message) return null;
  return (
    <div className={`text-sm ${state.ok ? 'text-good' : 'text-red-600'}`} role="status">
      <p>{state.message}</p>
      {state.details && state.details.length > 0 && (
        <ul className="mt-1 list-disc pl-5 text-muted">
          {state.details.map((d, i) => (
            <li key={i}>{d}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function AddChannelForm() {
  const [state, action, pending] = useActionState(addChannel, {});
  return (
    <form action={action} className="card space-y-2 p-3">
      <h2 className="font-semibold">Add a channel</h2>
      <input name="channel" required placeholder="youtube.com/@handle, @handle or UC… ID" className="input w-full" />
      <div className="grid grid-cols-[auto_1fr] gap-2">
        <select name="tier" defaultValue="direct" className="input" aria-label="Tier">
          <option value="direct">Direct</option>
          <option value="rising">Rising</option>
          <option value="format">Format</option>
          <option value="benchmark">Benchmark</option>
          <option value="mine">Mine</option>
        </select>
        <input name="why" placeholder="Why track it? (optional)" className="input w-full" />
      </div>
      <button className="btn-primary w-full sm:w-auto" disabled={pending} type="submit">
        {pending ? 'Adding and reading uploads…' : 'Add channel'}
      </button>
      <Result state={state} />
    </form>
  );
}

export function SyncControls() {
  const [syncState, sync, syncing] = useActionState(syncNowAction, {});
  const [seedState, seed, seeding] = useActionState(importSeedAction, {});
  return (
    <div className="card space-y-2 p-3">
      <h2 className="font-semibold">Sync</h2>
      <p className="text-sm text-muted">The daily job runs at about 1–2 am Pacific. Fresh data is never fetched twice.</p>
      <div className="flex flex-wrap gap-2">
        <form action={sync}>
          <button className="btn" disabled={syncing || seeding} type="submit">
            {syncing ? 'Syncing… (up to 4 min)' : 'Sync now'}
          </button>
        </form>
        <form action={seed}>
          <button className="btn" disabled={syncing || seeding} type="submit">
            {seeding ? 'Importing…' : 'Import seed list'}
          </button>
        </form>
      </div>
      <Result state={syncState} />
      <Result state={seedState} />
    </div>
  );
}
