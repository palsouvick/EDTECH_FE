import { useCallback, useEffect, useState } from 'react';
import { NavLink, Navigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../app/AuthContext';
import { request } from '../lib/api';
import AdminQuestionImport from './AdminQuestionImport';
import AdminVocabularyReview from './AdminVocabularyReview';

const TABS = ['overview', 'review', 'reports', 'bulk-upload', 'bengali-review'];
const TAB_LABELS = { 'bulk-upload': 'Bulk upload', 'bengali-review': 'Bengali review' };
const STATUSES = ['IN_REVIEW', 'DRAFT', 'PUBLISHED', 'ARCHIVED'];
const btn = 'min-h-9 rounded-lg px-3 text-xs font-semibold';
const tx = (v) => v?.en || v?.bn || v?.hi || '';

function QuestionCard({ q, onStatus, children }) {
  return (
    <article className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <span className="font-mono">{q.code}</span>
        <span className="rounded bg-slate-100 px-1.5 py-0.5 font-semibold dark:bg-slate-800">{q.status}</span>
        <span>{q.subject} / {q.topic}</span>
        {q.pyq.map((r) => <span key={r.code} className="rounded bg-amber-100 px-1.5 py-0.5 text-amber-900">{r.examName} {r.year}</span>)}
      </div>
      <p className="mt-2 font-medium text-slate-900 dark:text-white">{tx(q.stem)}</p>
      {q.stem.bn && <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{q.stem.bn}</p>}
      <ol className="mt-3 grid gap-1 text-sm sm:grid-cols-2">
        {q.options.map((o) => (
          <li key={o.optionId} className={o.optionId === q.correctOptionId ? 'font-semibold text-emerald-700 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}>
            {o.optionId === q.correctOptionId ? '✓ ' : '• '}{tx(o.text)}{o.text.bn ? ` / ${o.text.bn}` : ''}
          </li>
        ))}
      </ol>
      {q.steps.length > 0 && (
        <details className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          <summary className="cursor-pointer font-semibold">Solution</summary>
          <ol className="mt-1 list-decimal pl-5">{q.steps.map((s, i) => <li key={i}>{tx(s)}</li>)}</ol>
          {q.shortcut && <p className="mt-1 italic">Shortcut: {tx(q.shortcut)}</p>}
        </details>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        {onStatus && (
          <>
            <button type="button" className={`${btn} bg-emerald-600 text-white`} disabled={q.status === 'PUBLISHED'} onClick={() => onStatus(q.id, 'PUBLISHED')}>Approve & publish</button>
            <button type="button" className={`${btn} bg-slate-200 text-slate-800`} disabled={q.status === 'DRAFT'} onClick={() => onStatus(q.id, 'DRAFT')}>Back to draft</button>
            <button type="button" className={`${btn} bg-rose-100 text-rose-800`} disabled={q.status === 'ARCHIVED'} onClick={() => onStatus(q.id, 'ARCHIVED')}>Archive</button>
          </>
        )}
        {children}
      </div>
    </article>
  );
}

function Pager({ p, setPage }) {
  if (!p || p.totalPages <= 1) return null;
  return (
    <div className="mt-4 flex items-center justify-between text-sm">
      <button type="button" className={`${btn} ring-1 ring-slate-300 dark:text-white`} disabled={p.page <= 1} onClick={() => setPage(p.page - 1)}>Prev</button>
      <span className="text-slate-500">Page {p.page} / {p.totalPages} ({p.total})</span>
      <button type="button" className={`${btn} ring-1 ring-slate-300 dark:text-white`} disabled={p.page >= p.totalPages} onClick={() => setPage(p.page + 1)}>Next</button>
    </div>
  );
}

function Overview() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState(null);
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setData(await request('/admin/overview'));
      setUpdatedAt(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const questions = data?.questions || {};
  const totalQuestions = Object.values(questions).reduce((sum, count) => sum + count, 0);
  const published = questions.PUBLISHED || 0;
  const publishedShare = totalQuestions ? Math.round((published / totalQuestions) * 100) : 0;
  const metrics = [
    { label: 'Total questions', value: totalQuestions, detail: 'Across all publication states', color: 'indigo', href: '/admin/review', action: 'Open question review' },
    { label: 'Published', value: published, detail: `${publishedShare}% of the question bank`, color: 'emerald', href: '/admin/review?status=PUBLISHED', action: 'Manage published questions' },
    { label: 'In review', value: questions.IN_REVIEW || 0, detail: 'Waiting for admin review', color: 'amber', href: '/admin/review?status=IN_REVIEW', action: 'Review questions' },
    { label: 'Drafts', value: questions.DRAFT || 0, detail: 'Not yet published', color: 'slate', href: '/admin/review?status=DRAFT', action: 'View drafts' },
    { label: 'Open reports', value: data?.openReports || 0, detail: 'Student-submitted reports', color: 'rose', href: '/admin/reports', action: 'Resolve reports' },
    { label: 'Verified PYQs', value: data?.verifiedPyqs || 0, detail: 'Verified previous-year questions', color: 'sky' },
    { label: 'Users', value: data?.users || 0, detail: 'Registered user accounts', color: 'violet' },
  ];
  const colorClasses = {
    indigo: 'bg-indigo-50 text-indigo-700 ring-indigo-100 dark:bg-indigo-950/50 dark:text-indigo-300 dark:ring-indigo-900',
    emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-900',
    amber: 'bg-amber-50 text-amber-800 ring-amber-100 dark:bg-amber-950/50 dark:text-amber-300 dark:ring-amber-900',
    slate: 'bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700',
    rose: 'bg-rose-50 text-rose-700 ring-rose-100 dark:bg-rose-950/50 dark:text-rose-300 dark:ring-rose-900',
    sky: 'bg-sky-50 text-sky-700 ring-sky-100 dark:bg-sky-950/50 dark:text-sky-300 dark:ring-sky-900',
    violet: 'bg-violet-50 text-violet-700 ring-violet-100 dark:bg-violet-950/50 dark:text-violet-300 dark:ring-violet-900',
  };

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl bg-linear-to-br from-slate-950 via-indigo-950 to-indigo-800 p-6 text-white shadow-lg sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-200">Content operations</p>
            <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Admin overview</h1>
            <p className="mt-2 text-sm leading-relaxed text-indigo-100 sm:text-base">
              Monitor your question bank, review queue, reports, and previous-year questions from one place.
            </p>
          </div>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-white/10 px-4 text-sm font-semibold text-white ring-1 ring-white/20 hover:bg-white/20 disabled:cursor-wait disabled:opacity-60"
          >
            <span aria-hidden="true">↻</span>{loading ? 'Refreshing…' : 'Refresh data'}
          </button>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-indigo-100">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 ring-1 ring-white/15">
            <span className={`size-2 rounded-full ${error ? 'bg-rose-400' : loading ? 'bg-amber-300' : 'bg-emerald-300'}`} />
            {error ? 'Connection issue' : loading ? 'Updating dashboard' : 'Dashboard up to date'}
          </span>
          {updatedAt && <span>Last updated {updatedAt.toLocaleTimeString()}</span>}
        </div>
      </section>

      {error && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-rose-50 p-4 text-sm text-rose-800 ring-1 ring-rose-200 dark:bg-rose-950/30 dark:text-rose-200 dark:ring-rose-900">
          <span>Could not refresh dashboard data: {error}</span>
          <button type="button" onClick={load} className="rounded-lg px-3 py-2 font-semibold ring-1 ring-rose-300 hover:bg-rose-100 dark:ring-rose-800 dark:hover:bg-rose-950">Try again</button>
        </div>
      )}

      <section aria-labelledby="admin-metrics-heading">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 id="admin-metrics-heading" className="text-lg font-bold text-slate-900 dark:text-white">Question bank at a glance</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Live totals from the admin overview service.</p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <article key={metric.label} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">{metric.label}</p>
                  <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
                    {loading && !data ? <span className="inline-block h-9 w-20 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" aria-label="Loading" /> : metric.value.toLocaleString()}
                  </p>
                </div>
                <span className={`rounded-xl px-2.5 py-1 text-xs font-bold ring-1 ${colorClasses[metric.color]}`}>
                  {metric.label === 'Published' ? `${publishedShare}%` : metric.label === 'Open reports' || metric.label === 'In review' ? 'ACTION' : 'LIVE'}
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{metric.detail}</p>
              {metric.href && (
                <NavLink to={metric.href} className="mt-4 inline-flex text-xs font-bold text-indigo-700 hover:text-indigo-900 dark:text-indigo-300 dark:hover:text-indigo-200">
                  {metric.action}<span className="ml-1" aria-hidden="true">→</span>
                </NavLink>
              )}
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="admin-actions-heading">
        <div className="mb-3">
          <h2 id="admin-actions-heading" className="text-lg font-bold text-slate-900 dark:text-white">Quick actions</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Jump straight to the tasks that keep your exam content healthy.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {[
            { title: 'Review questions', description: `${(questions.IN_REVIEW || 0).toLocaleString()} questions currently in review`, href: '/admin/review', label: 'Open review queue', color: 'indigo' },
            { title: 'Resolve reports', description: `${(data?.openReports || 0).toLocaleString()} open reports need attention`, href: '/admin/reports', label: 'Open reports', color: 'rose' },
            { title: 'Bulk upload', description: 'Import, preview, and manage question batches', href: '/admin/bulk-upload', label: 'Manage imports', color: 'emerald' },
          ].map((action) => (
            <NavLink key={action.title} to={action.href} className="group rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md dark:bg-slate-900 dark:ring-slate-800">
              <span className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-bold ${action.color === 'rose' ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300' : action.color === 'emerald' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300' : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300'}`}>
                {action.title}
              </span>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{action.description}</p>
              <p className="mt-4 text-sm font-bold text-slate-900 group-hover:text-indigo-700 dark:text-white dark:group-hover:text-indigo-300">
                {action.label}<span className="ml-2" aria-hidden="true">→</span>
              </p>
            </NavLink>
          ))}
        </div>
      </section>
    </div>
  );
}

function Review() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedStatus = searchParams.get('status');
  const status = STATUSES.includes(selectedStatus) ? selectedStatus : 'IN_REVIEW';
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    const qs = new URLSearchParams({ status, page: String(page), limit: '10' });
    if (q.trim()) qs.set('q', q.trim());
    request(`/admin/questions?${qs}`).then((d) => { setData(d); setError(''); }).catch((e) => setError(e.message));
  }, [status, page, q]);
  useEffect(load, [load]);

  const setQuestionStatus = async (id, next) => {
    try { await request(`/admin/questions/${id}/status`, { method: 'PATCH', body: { status: next } }); load(); } catch (e) { setError(e.message); }
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <button key={s} type="button" onClick={() => { setSearchParams({ status: s }); setPage(1); }} className={`${btn} ${s === status ? 'bg-indigo-600 text-white' : 'bg-white ring-1 ring-slate-300 dark:bg-slate-900 dark:text-white'}`}>{s.replace('_', ' ')}</button>
        ))}
        <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search code or text" className="min-h-9 flex-1 rounded-lg border border-slate-300 px-3 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
      </div>
      {error && <p role="alert" className="mb-3 text-sm text-rose-600">{error}</p>}
      <div className="space-y-3">
        {data?.questions.map((x) => <QuestionCard key={x.id} q={x} onStatus={setQuestionStatus} />)}
        {data && data.questions.length === 0 && <p className="text-slate-500">Nothing in this queue.</p>}
      </div>
      <Pager p={data?.pagination} setPage={setPage} />
    </div>
  );
}

function Reports() {
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const load = useCallback(() => {
    request(`/admin/reports?status=OPEN&page=${page}&limit=10`).then(setData).catch((e) => setError(e.message));
  }, [page]);
  useEffect(load, [load]);
  const resolve = async (id, status) => {
    try { await request(`/admin/reports/${id}`, { method: 'PATCH', body: { status } }); load(); } catch (e) { setError(e.message); }
  };
  return (
    <div className="space-y-3">
      {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}
      {data?.reports.map((r) => (
        <div key={r.id}>
          <p className="mb-1 text-sm text-slate-700 dark:text-slate-300"><b>{r.reason}</b>{r.message ? ` — ${r.message}` : ''}</p>
          {r.question ? (
            <QuestionCard q={r.question} onStatus={null}>
              <button type="button" className={`${btn} bg-emerald-600 text-white`} onClick={() => resolve(r.id, 'RESOLVED')}>Mark resolved</button>
              <button type="button" className={`${btn} bg-slate-200 text-slate-800`} onClick={() => resolve(r.id, 'REJECTED')}>Reject report</button>
              <button type="button" className={`${btn} bg-rose-100 text-rose-800`} onClick={async () => { await request(`/admin/questions/${r.question.id}/status`, { method: 'PATCH', body: { status: 'DRAFT' } }).catch(() => {}); resolve(r.id, 'RESOLVED'); }}>Pull question to draft</button>
            </QuestionCard>
          ) : <p className="text-sm text-slate-500">Question no longer exists.</p>}
        </div>
      ))}
      {data && data.reports.length === 0 && <p className="text-slate-500">No open reports.</p>}
      <Pager p={data?.pagination} setPage={setPage} />
    </div>
  );
}

/** /admin/:tab? — separate admin console. The server enforces access; this guard is only for UX. */
export default function AdminPage() {
  const { status, user, logout } = useAuth();
  const { tab: param } = useParams();
  const tab = TABS.includes(param) ? param : 'overview';
  if (status === 'loading') return null;
  if (!user?.isAdmin) return <Navigate to="/admin/login" replace />;
  if (param && !TABS.includes(param)) return <Navigate to="/admin" replace />;
  return (
    <div className="min-h-dvh bg-slate-50 dark:bg-slate-950">
      <header className="border-b border-slate-800 bg-slate-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-indigo-600 font-bold text-white">Σ</span>
            <span className="font-semibold text-white">Admin Console</span>
          </div>
          <nav className="flex flex-wrap justify-end gap-1" aria-label="Admin sections">
            {TABS.map((t) => (
              <NavLink key={t} to={t === 'overview' ? '/admin' : `/admin/${t}`} end className={() => `${btn} inline-flex items-center capitalize ${t === tab ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>{TAB_LABELS[t] ?? t}</NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-3 text-sm text-slate-300">
            <span className="hidden sm:inline">{user.email}</span>
            <button type="button" className={`${btn} bg-slate-800 text-white`} onClick={logout}>Sign out</button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8">
        {tab !== 'overview' && <h1 className="mb-6 text-2xl font-bold capitalize text-slate-900 dark:text-white">{TAB_LABELS[tab] ?? tab}</h1>}
        {tab === 'overview' && <Overview />}
        {tab === 'review' && <Review />}
        {tab === 'reports' && <Reports />}
        {tab === 'bulk-upload' && <AdminQuestionImport />}
        {tab === 'bengali-review' && <AdminVocabularyReview />}
      </main>
    </div>
  );
}
