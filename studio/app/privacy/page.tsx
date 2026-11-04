export const metadata = { title: 'Privacy · WQL Studio' };

/** Public privacy policy, linked from the Google OAuth consent screen. */
export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl space-y-4 px-4 py-10 text-sm leading-relaxed">
      <h1 className="text-2xl font-bold">WQL Studio privacy policy</h1>
      <p className="text-muted">Last updated: 3 November 2026</p>
      <p>
        WQL Studio is a private research and planning tool for the YouTube channel Weird Questions Lab. It has one user, the
        channel owner. Nobody else can sign in.
      </p>
      <h2 className="pt-2 text-lg font-semibold">What it reads</h2>
      <ul className="list-disc space-y-1 pl-5">
        <li>Public data about public YouTube channels and videos (titles, view counts, upload dates), through the YouTube Data API.</li>
        <li>
          When the owner connects their Google account: read-only analytics for the owner&apos;s own channel (views, watch time,
          audience retention), through the YouTube Analytics API, using the scopes <code>yt-analytics.readonly</code> and{' '}
          <code>youtube.readonly</code>.
        </li>
      </ul>
      <h2 className="pt-2 text-lg font-semibold">What it does with it</h2>
      <p>
        The data is stored in a private database (Supabase) that only the owner can read, and is used only to plan and review the
        owner&apos;s videos. It is not sold, shared with anyone, or used for advertising. WQL Studio never uploads, edits or deletes
        anything on YouTube with these read-only permissions.
      </p>
      <h2 className="pt-2 text-lg font-semibold">Google user data</h2>
      <p>
        WQL Studio&apos;s use of information received from Google APIs adheres to the{' '}
        <a className="underline" href="https://developers.google.com/terms/api-services-user-data-policy">
          Google API Services User Data Policy
        </a>
        , including the Limited Use requirements. Google sign-in tokens are stored encrypted and used only to fetch the owner&apos;s
        own analytics.
      </p>
      <h2 className="pt-2 text-lg font-semibold">Removing access</h2>
      <p>
        The owner can revoke access at any time at{' '}
        <a className="underline" href="https://myaccount.google.com/permissions">
          myaccount.google.com/permissions
        </a>
        , and can delete all stored data from the database.
      </p>
      <h2 className="pt-2 text-lg font-semibold">Contact</h2>
      <p>Questions: use the contact details on the Weird Questions Lab YouTube channel.</p>
    </main>
  );
}
