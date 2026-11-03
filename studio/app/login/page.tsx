import { LoginForm } from './LoginForm';

export const metadata = { title: 'Sign in · WQL Studio' };

export default async function LoginPage({ searchParams }: PageProps<'/login'>) {
  const { error } = await searchParams;
  return (
    <main className="mx-auto mt-16 max-w-sm px-4">
      <h1 className="mb-1 text-2xl font-bold">WQL Studio</h1>
      <p className="mb-6 text-sm text-muted">Weird Questions Lab research and planning.</p>
      {error === 'not-owner' && <p className="mb-4 text-sm text-red-600">That account isn&apos;t allowed in this Studio.</p>}
      {error === 'link' && <p className="mb-4 text-sm text-red-600">That sign-in link didn&apos;t work. Request a new one.</p>}
      <LoginForm />
    </main>
  );
}
