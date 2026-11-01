import { useCallback, useEffect, useState } from 'react';
import { request } from '../lib/api';
import QuestionEditor from '../components/admin/QuestionEditor';

const btn = 'min-h-9 rounded-lg px-3 text-xs font-semibold';
const input = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white';
const panel = 'rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800';
const TOPICS = ['indian_gk', 'west_bengal_gk', 'indian_history', 'geography', 'general_science', 'polity', 'economy', 'current_affairs', 'computer_awareness', 'environment', 'art_culture', 'static_gk'];
const fmt = (d) => (d ? new Date(d).toLocaleString() : '');
const TONE = {
  VERIFIED: 'bg-emerald-100 text-emerald-800',
  NEEDS_REVIEW: 'bg-amber-100 text-amber-900',
  UNVERIFIED: 'bg-slate-200 text-slate-700',
  PENDING: 'bg-amber-50 text-amber-800',
  REVIEWED: 'bg-emerald-50 text-emerald-800',
};

function Summary({ data }) {
  if (!data) return null;
  const rows = Object.entries(data.topics).sort(([a], [b]) => a.localeCompare(b));
  return (
    <section className={panel}>
      <h2 className="font-bold text-slate-900 dark:text-white">GK library</h2>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full text-left text-xs tabular-nums">
          <thead className="text-slate-500">
            <tr><th className="py-1 pr-3">Card</th><th>Facts</th><th>Published</th><th>Verified</th><th>Needs review</th><th>Unverified</th><th>Retired</th><th>Bengali pending</th></tr>
          </thead>
          <tbody>
            {rows.map(([t, r]) => (
              <tr key={t} className="border-t border-slate-100 dark:border-slate-800">
                <td className="py-1 pr-3 font-mono">{t}</td><td>{r.total}</td><td>{r.published}</td><td>{r.verified}</td><td>{r.needsReview}</td><td>{r.unverified}</td><td>{r.retired}</td><td>{r.bengaliPending}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-slate-600 dark:text-slate-300">
        General Studies questions (published): {data.gsQuestions.SOURCE_VERIFIED} source verified · {data.gsQuestions.SOURCE_PENDING} source pending · {data.gsQuestions.NEEDS_REVIEW} needs review · {data.gsQuestions.RETIRED} retired.
        {' '}Due for re-checking: {data.staleFacts} facts, {data.staleQuestions} questions.
      </p>
    </section>
  );
}

function FactDetail({ id, onClose, onChanged }) {
  const [d, setD] = useState(null);
  const [error, setError] = useState('');
  const [notes, setNotes] = useState('');
  const [edit, setEdit] = useState(null);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const load = useCallback(() => request(`/admin/gk/facts/${id}`).then((x) => { setD(x); setEdit(null); }).catch((e) => setError(e.message)), [id]);
  useEffect(() => { load(); }, [load]);

  const act = async (path, body) => {
    setError('');
    try {
      setD(await request(`/admin/gk/facts/${id}/${path}`, { method: 'POST', body }));
      onChanged();
    } catch (e) {
      setError(e.message);
    }
  };
  const saveEdit = async () => {
    setError('');
    try {
      const f = d.fact;
      const changes = {};
      for (const k of ['title', 'statement', 'explanation']) if (JSON.stringify(edit[k]) !== JSON.stringify(f[k])) changes[k] = edit[k];
      if (edit.difficulty !== f.difficulty) changes.difficulty = edit.difficulty;
      if (edit.sourcesJson !== JSON.stringify(f.sources, null, 2)) changes.sources = JSON.parse(edit.sourcesJson).map((s) => ({ title: s.title, url: s.url, publisher: s.publisher || undefined, publisher_type: s.publisherType || s.publisher_type, accessed_at: s.accessedAt || s.accessed_at || null, quote: s.quote || undefined }));
      setD(await request(`/admin/gk/facts/${id}`, { method: 'PATCH', body: { reason: edit.reason, changes } }));
      setEdit(null);
      onChanged();
    } catch (e) {
      setError(e.message);
    }
  };

  const f = d?.fact;
  return (
    <div role="dialog" aria-modal="true" aria-label="GK fact" className="fixed inset-0 z-40 flex justify-end bg-slate-950/50">
      <div className="h-full w-full max-w-3xl overflow-y-auto bg-white p-5 shadow-xl dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">{f?.code}</h2>
          <button type="button" onClick={onClose} className={`${btn} ring-1 ring-slate-300 dark:text-white`}>Close</button>
        </div>
        {error && <p role="alert" className="mt-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
        {f && !edit && (
          <div className="mt-3 space-y-3 text-sm text-slate-800 dark:text-slate-100">
            <div className="flex flex-wrap gap-2 text-xs font-semibold">
              <span className="rounded bg-slate-100 px-1.5 py-0.5 dark:bg-slate-800">{f.status}</span>
              <span className={`rounded px-1.5 py-0.5 ${TONE[f.verification.status]}`}>fact: {f.verification.status}</span>
              <span className={`rounded px-1.5 py-0.5 ${TONE[f.bengaliReview.status]}`}>Bengali: {f.bengaliReview.status}{f.bengaliReview.reviewedBy ? ` by ${f.bengaliReview.reviewedBy} on ${f.bengaliReview.reviewedAt}` : ''}</span>
              <span>{f.topic}/{f.subtopic} · d{f.difficulty} · v{f.version} · {f.origin}</span>
            </div>
            <p className="font-semibold">{f.title.en} / {f.title.bn}</p>
            <p>{f.statement.en}</p>
            <p>{f.statement.bn}</p>
            {f.explanation && <p className="text-slate-600 dark:text-slate-300">{f.explanation.en}<br />{f.explanation.bn}</p>}
            {f.verification.notes && <p className="rounded bg-amber-50 p-2 text-xs text-amber-900">Notes: {f.verification.notes}</p>}
            <div>
              <p className="font-semibold">Sources</p>
              {f.sources.map((s) => (
                <div key={s.url} className="mt-1 rounded bg-slate-50 p-2 text-xs dark:bg-slate-950">
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-indigo-600 underline">{s.title}</a> · {s.publisherType} · accessed {s.accessedAt}
                  {s.quote && <blockquote className="mt-1 border-l-2 border-slate-300 pl-2 italic">“{s.quote}”</blockquote>}
                </div>
              ))}
            </div>
            <label className="block">
              <span className="font-semibold">Notes for this action (kept in the history)</span>
              <input className={input} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </label>
            <div className="flex flex-wrap gap-2">
              <button type="button" className={`${btn} bg-emerald-600 text-white disabled:opacity-50`} disabled={notes.trim().length < 3 || f.status === 'RETIRED'} onClick={() => act('verification', { status: 'VERIFIED', notes })}>Mark verified</button>
              <button type="button" className={`${btn} bg-amber-100 text-amber-900 disabled:opacity-50`} disabled={notes.trim().length < 3 || f.status === 'RETIRED'} onClick={() => act('verification', { status: 'NEEDS_REVIEW', notes })}>Needs review</button>
              <button type="button" className={`${btn} bg-sky-100 text-sky-900 disabled:opacity-50`} disabled={f.bengaliReview.status === 'REVIEWED'} onClick={() => act('bengali-review', { note: notes || undefined })}>Approve Bengali</button>
              <button type="button" className={`${btn} bg-rose-100 text-rose-800 disabled:opacity-50`} disabled={notes.trim().length < 3} onClick={() => act(f.status === 'RETIRED' ? 'restore' : 'retire', { reason: notes })}>{f.status === 'RETIRED' ? 'Restore' : 'Retire'}</button>
              <button type="button" className={`${btn} bg-indigo-600 text-white`} onClick={() => setEdit({ title: f.title, statement: f.statement, explanation: f.explanation || { en: '', bn: '' }, difficulty: f.difficulty, sourcesJson: JSON.stringify(f.sources, null, 2), reason: '' })}>Edit</button>
            </div>
            <div>
              <p className="font-semibold">Questions ({d.questions.length})</p>
              <ul className="mt-1 space-y-1">
                {d.questions.map((q) => (
                  <li key={q.id} className="flex flex-wrap items-center justify-between gap-2 rounded bg-slate-50 p-2 text-xs dark:bg-slate-950">
                    <span><span className="font-mono">{q.code}</span> · {q.status} · {q.sourceCheck}{q.format ? ` · ${q.format}` : ''}{q.writtenForFact ? '' : ' · older question'} — {q.stem?.en} <b>→ {q.correct?.en}</b></span>
                    <button type="button" className={`${btn} ring-1 ring-slate-300 dark:text-white`} onClick={() => setEditingQuestion(q.id)}>Edit question</button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-semibold">History</p>
              {d.history.length === 0 && <p className="text-slate-500">No admin changes yet.</p>}
              <ol className="mt-1 space-y-1 text-xs">
                {d.history.map((h, i) => (
                  <li key={i} className="rounded bg-slate-50 p-2 dark:bg-slate-950">
                    <b>v{h.version} {h.action}</b> by {h.by} · {fmt(h.at)}{h.reason ? ` · ${h.reason}` : ''}
                    {h.changes.length > 0 && <span> · {h.changes.map((c) => c.field).join(', ')}</span>}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}
        {edit && (
          <div className="mt-3 space-y-3 text-sm">
            <p className="text-xs text-amber-800">Changing the statement, dates or sources sends a verified fact back to review and unpublishes it until it is verified again. Changing Bengali resets the Bengali review.</p>
            {['title', 'statement', 'explanation'].map((k) => (
              <div key={k} className="grid gap-2 sm:grid-cols-2">
                {['en', 'bn'].map((l) => (
                  <label key={l} className="block">
                    <span className="font-semibold">{k} ({l})</span>
                    <textarea rows={k === 'title' ? 1 : 3} className={input} value={edit[k][l] || ''} onChange={(e) => setEdit({ ...edit, [k]: { ...edit[k], [l]: e.target.value } })} />
                  </label>
                ))}
              </div>
            ))}
            <label className="block">
              <span className="font-semibold">Difficulty (1–5)</span>
              <input type="number" min={1} max={5} className={`${input} w-24`} value={edit.difficulty} onChange={(e) => setEdit({ ...edit, difficulty: Number(e.target.value) })} />
            </label>
            <label className="block">
              <span className="font-semibold">Sources (JSON: title, url, publisherType, accessedAt, quote)</span>
              <textarea rows={8} className={`${input} font-mono text-xs`} value={edit.sourcesJson} onChange={(e) => setEdit({ ...edit, sourcesJson: e.target.value })} />
            </label>
            <label className="block">
              <span className="font-semibold">Reason</span>
              <input className={input} value={edit.reason} onChange={(e) => setEdit({ ...edit, reason: e.target.value })} />
            </label>
            <div className="flex gap-2">
              <button type="button" className={`${btn} bg-indigo-600 text-white disabled:opacity-50`} disabled={edit.reason.trim().length < 3} onClick={saveEdit}>Save</button>
              <button type="button" className={`${btn} ring-1 ring-slate-300 dark:text-white`} onClick={() => setEdit(null)}>Cancel</button>
            </div>
          </div>
        )}
      </div>
      {editingQuestion && <QuestionEditor id={editingQuestion} onClose={() => { setEditingQuestion(null); load(); }} onSaved={onChanged} />}
    </div>
  );
}

function ImportPanel({ onImported }) {
  const [text, setText] = useState('');
  const [report, setReport] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const preview = async () => {
    setError(''); setResult(null);
    try { setReport(await request('/admin/gk/import/preview', { method: 'POST', body: { jsonl: text } })); } catch (e) { setError(e.message); }
  };
  const commit = async () => {
    setError('');
    try { setResult(await request('/admin/gk/import/commit', { method: 'POST', body: { jsonl: text } })); setReport(null); onImported(); } catch (e) { setError(e.message); }
  };
  return (
    <details className={panel}>
      <summary className="cursor-pointer font-bold text-slate-900 dark:text-white">Bulk import (JSONL, one fact per line, format in backend/db/gk/README.md)</summary>
      <textarea rows={6} className={`${input} mt-3 font-mono text-xs`} value={text} onChange={(e) => { setText(e.target.value); setReport(null); }} placeholder='{"code":"GK-IGK-101", ...}' />
      <div className="mt-2 flex gap-2">
        <button type="button" className={`${btn} bg-slate-800 text-white`} disabled={!text.trim()} onClick={preview}>Check file</button>
        <button type="button" className={`${btn} bg-emerald-600 text-white disabled:opacity-50`} disabled={!report?.valid} onClick={commit}>Import {report?.facts ?? ''} facts</button>
      </div>
      {error && <p role="alert" className="mt-2 text-sm text-rose-600">{error}</p>}
      {report && (
        <div className="mt-2 text-xs">
          <p>{report.facts} facts ({report.verified} marked verified), {report.questions} questions · {report.valid ? 'no problems found' : `${report.errors.length} problems`}</p>
          <ul className="mt-1 max-h-48 list-disc overflow-y-auto pl-4 text-rose-700">
            {report.errors.map((e, i) => <li key={i}>Line {e.row ?? '–'} {e.factCode ?? ''} {e.field}: {e.message}</li>)}
          </ul>
        </div>
      )}
      {result && <p className="mt-2 text-xs text-emerald-700">Imported {result.inserted} facts ({result.published} published, {result.draft} held as draft), {result.questionsInserted} questions, {result.linked} links to existing questions.</p>}
    </details>
  );
}

/** Admin → GK content: library status, review queues, fact editing with history, import. */
export default function AdminGkContent() {
  const [summary, setSummary] = useState(null);
  const [filters, setFilters] = useState({ topic: '', verification: '', bengali: '', status: '', q: '', stale: '' });
  const [page, setPage] = useState(1);
  const [list, setList] = useState(null);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(null);

  const load = useCallback(() => {
    const qs = new URLSearchParams({ page: String(page), limit: '25', ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) });
    request(`/admin/gk/facts?${qs}`).then((d) => { setList(d); setError(''); }).catch((e) => setError(e.message));
    request('/admin/gk/summary').then(setSummary).catch(() => {});
  }, [filters, page]);
  useEffect(load, [load]);
  const set = (k) => (e) => { setFilters({ ...filters, [k]: e.target.value }); setPage(1); };

  return (
    <div className="space-y-4">
      <Summary data={summary} />
      <ImportPanel onImported={load} />
      <section className={panel}>
        <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
          <select aria-label="Card" className={input} value={filters.topic} onChange={set('topic')}><option value="">All cards</option>{TOPICS.map((t) => <option key={t}>{t}</option>)}</select>
          <select aria-label="Verification" className={input} value={filters.verification} onChange={set('verification')}><option value="">Any verification</option><option>VERIFIED</option><option>NEEDS_REVIEW</option><option>UNVERIFIED</option></select>
          <select aria-label="Bengali review" className={input} value={filters.bengali} onChange={set('bengali')}><option value="">Any Bengali</option><option value="PENDING">Bengali pending</option><option value="REVIEWED">Bengali reviewed</option></select>
          <select aria-label="Status" className={input} value={filters.status} onChange={set('status')}><option value="">Any status</option><option>PUBLISHED</option><option>DRAFT</option><option>RETIRED</option></select>
          <select aria-label="Review date" className={input} value={filters.stale} onChange={set('stale')}><option value="">Any review date</option><option value="true">Past review date</option></select>
          <input aria-label="Search" className={input} placeholder="Search code or text" value={filters.q} onChange={set('q')} />
        </div>
        {error && <p role="alert" className="mt-2 text-sm text-rose-600">{error}</p>}
        <ul className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
          {list?.facts.map((f) => (
            <li key={f.id}>
              <button type="button" onClick={() => setOpen(f.id)} className="flex w-full flex-wrap items-center gap-2 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-950">
                <span className="font-mono text-xs text-slate-500">{f.code}</span>
                <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${TONE[f.verification.status]}`}>{f.verification.status}</span>
                <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${TONE[f.bengaliReview.status]}`}>BN {f.bengaliReview.status}</span>
                <span className="text-[10px] font-bold text-slate-500">{f.status}</span>
                <span className="min-w-0 flex-1 truncate text-slate-900 dark:text-white">{f.title.en}</span>
              </button>
            </li>
          ))}
          {list && list.facts.length === 0 && <li className="py-3 text-slate-500">No facts match.</li>}
        </ul>
        {list?.pagination.totalPages > 1 && (
          <div className="mt-3 flex items-center justify-between text-sm">
            <button type="button" className={`${btn} ring-1 ring-slate-300 dark:text-white`} disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</button>
            <span className="text-slate-500">Page {page} / {list.pagination.totalPages} ({list.pagination.total})</span>
            <button type="button" className={`${btn} ring-1 ring-slate-300 dark:text-white`} disabled={page >= list.pagination.totalPages} onClick={() => setPage(page + 1)}>Next</button>
          </div>
        )}
      </section>
      {open && <FactDetail id={open} onClose={() => setOpen(null)} onChanged={load} />}
    </div>
  );
}
