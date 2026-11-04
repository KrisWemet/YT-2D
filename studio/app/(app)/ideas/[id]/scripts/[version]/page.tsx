import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ScriptView } from '@/components/ScriptView';
import { requireOwner } from '@/lib/auth/owner';

export const metadata = { title: 'Script version · WQL Studio' };

/** A past script version, read-only, with the fact-check it had. */
export default async function ScriptVersionPage({ params }: PageProps<'/ideas/[id]/scripts/[version]'>) {
  const { id, version } = await params;
  const { supabase } = await requireOwner();
  const v = Number(version);
  if (!Number.isInteger(v) || v < 1) notFound();
  const [{ data: idea }, { data: script }] = await Promise.all([
    supabase.from('ideas').select('id, question').eq('id', id).maybeSingle(),
    supabase.from('scripts').select('*').eq('idea_id', id).eq('version', v).maybeSingle(),
  ]);
  if (!idea || !script) notFound();
  const { data: claims } = await supabase.from('claims').select('*').eq('script_id', script.id);
  return (
    <div className="space-y-4">
      <Link href={`/ideas/${idea.id}`} className="text-sm text-muted hover:text-fg">
        ← {idea.question}
      </Link>
      <h1 className="text-xl font-bold">
        Script v{script.version} {script.is_current ? <span className="chip ml-1">current</span> : <span className="chip ml-1 text-muted">older</span>}
      </h1>
      <ScriptView script={script} claims={claims ?? []} editable={false} />
    </div>
  );
}
