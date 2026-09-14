import { useApp } from '../../context/AppContext';

const statusLabels: Record<string, string> = {
  pending: 'Under review', reviewed: 'Review completed', approved: 'Selected',
  rejected: 'Not selected', withdrawn: 'Withdrawn',
};

export default function StudentApplications({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const { applications, currentUser } = useApp();
  const mine = applications.filter(item => item.studentId === currentUser?.uid)
    .toSorted((a, b) => b.createdAt - a.createdAt);
  return <section className="mx-auto w-full max-w-5xl space-y-6 p-6">
    <header>
      <h1 className="text-2xl font-bold tracking-tight text-neutral-950">Your applications</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">Track submitted proposals and review results. An application review is not a completed project or a hiring guarantee.</p>
    </header>
    {mine.length === 0 ? <div className="rounded-3xl border border-neutral-200 bg-white p-8">
      <h2 className="font-semibold">No applications yet</h2>
      <p className="mt-2 text-sm leading-6 text-neutral-600">Explore current projects and submit a proposal when you find a suitable opportunity.</p>
      <button onClick={() => onNavigate('project-marketplace')} className="mt-5 rounded-xl bg-neutral-950 px-4 py-3 text-sm font-semibold text-white">Explore projects</button>
    </div> : mine.map(item => <article key={item.id} className="space-y-4 rounded-3xl border border-neutral-200 bg-white p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 className="text-lg font-semibold text-neutral-950">{item.projectTitle}</h2>
        <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium">{statusLabels[item.status] || item.status}</span>
      </div>
      <p className="text-xs text-neutral-500">Submitted {new Date(item.createdAt).toLocaleDateString()}</p>
      <div><h3 className="text-sm font-semibold">Your proposal</h3><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-neutral-600">{item.codeSubmission}</p></div>
      {item.feedback && <div><h3 className="text-sm font-semibold">Review feedback</h3><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-neutral-600">{item.feedback}</p></div>}
      <button onClick={() => onNavigate('trust-operations')} className="text-sm font-semibold text-teal-700 underline underline-offset-4">View contracts and project records</button>
    </article>)}
  </section>;
}
