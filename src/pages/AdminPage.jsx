import { useCallback, useEffect, useState } from 'react';
import { NavLink, Navigate, useParams } from 'react-router-dom';
import { useAuth } from '../app/AuthContext';
import { request } from '../lib/api';

const TABS = ['overview', 'review', 'reports'];
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
  const [d, setD] = useState(null);
  useEffect(() => { request('/admin/overview').then(setD).catch(() => setD(false)); }, []);
  if (d === false) return <p className="text-rose-600">Could not load.</p>;
  if (!d) return <p className="text-slate-500">Loading…</p>;
  const cards = [...Object.entries(d.questions), ['OPEN REPORTS', d.openReports], ['VERIFIED PYQS', d.verifiedPyqs], ['USERS', d.users]];
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {cards.map(([k, v]) => (
        <div key={k} className="rounded-2xl bg-white p-4 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{v}</div>
          <div className="text-xs font-semibold text-slate-500">{k.replace('_', ' ')}</div>
        </div>
      ))}
    </div>
  );
}

function Review() {
  const [status, setStatus] = useState('IN_REVIEW');
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
          <button key={s} type="button" onClick={() => { setStatus(s); setPage(1); }} className={`${btn} ${s === status ? 'bg-indigo-600 text-white' : 'bg-white ring-1 ring-slate-300 dark:bg-slate-900 dark:text-white'}`}>{s.replace('_', ' ')}</button>
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
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-indigo-600 font-bold text-white">Σ</span>
            <span className="font-semibold text-white">Admin Console</span>
          </div>
          <nav className="flex gap-1" aria-label="Admin sections">
            {TABS.map((t) => (
              <NavLink key={t} to={t === 'overview' ? '/admin' : `/admin/${t}`} end className={() => `${btn} inline-flex items-center capitalize ${t === tab ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>{t}</NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-3 text-sm text-slate-300">
            <span className="hidden sm:inline">{user.email}</span>
            <button type="button" className={`${btn} bg-slate-800 text-white`} onClick={logout}>Sign out</button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold capitalize text-slate-900 dark:text-white">{tab}</h1>
        {tab === 'overview' && <Overview />}
        {tab === 'review' && <Review />}
        {tab === 'reports' && <Reports />}
      </main>
    </div>
  );
}
