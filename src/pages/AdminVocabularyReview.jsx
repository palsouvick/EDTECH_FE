import { useCallback, useEffect, useState } from 'react';
import { request } from '../lib/api';

const btn = 'min-h-9 rounded-lg px-3 text-sm font-semibold disabled:opacity-50';
const field = 'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white';
const FIELDS = [
  ['meaningBn', 'Bengali meaning', 1],
  ['explanationBn', 'Bengali explanation', 2],
  ['exampleBn', 'Bengali example', 2],
  ['definitionEn', 'English definition', 2],
  ['exampleEn', 'English example', 2],
];

function ReviewCard({ word, onSaved }) {
  const [draft, setDraft] = useState(() => Object.fromEntries(FIELDS.map(([k]) => [k, word[k] || ''])));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const changes = Object.fromEntries(FIELDS.filter(([k]) => draft[k].trim() !== (word[k] || '')).map(([k]) => [k, draft[k]]));
  const dirty = Object.keys(changes).length > 0;
  const pyq = word.examRelevance.some((r) => r.basis === 'PYQ_VERIFIED');
  const reviewed = word.bengaliReview.status === 'REVIEWED';

  const save = async (markReviewed) => {
    setBusy(true);
    setError('');
    try {
      await request(`/admin/vocabulary/words/${word.id}/content`, { method: 'PATCH', body: { ...changes, markReviewed } });
      onSaved();
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  };
  const reopen = async () => {
    setBusy(true);
    try {
      await request(`/admin/vocabulary/words/${word.id}/bengali-review`, { method: 'PUT', body: { status: 'PENDING' } });
      onSaved();
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  };

  return (
    <article className="rounded-xl bg-white p-4 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">{word.word} <span className="text-xs font-medium uppercase text-slate-500">{word.partOfSpeech} · {word.difficulty}</span></h3>
        <p className="text-xs text-slate-500">
          priority {word.reviewPriority}
          {pyq && <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-amber-900">official exam word</span>}
          {reviewed && <span className="ml-2 rounded bg-emerald-100 px-1.5 py-0.5 text-emerald-900">reviewed by {word.bengaliReview.reviewedBy} on {new Date(word.bengaliReview.reviewedAt).toLocaleDateString()}</span>}
        </p>
      </header>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
        Synonyms: {word.synonyms.join(', ') || '—'} · Antonyms: {word.antonyms.join(', ') || '—'}
      </p>
      {word.lexicalChecks?.unconfirmed?.length > 0 && (
        <p className="mt-1 text-xs text-slate-500">Not confirmed by WordNet (shown to students, never used as a test answer): {word.lexicalChecks.unconfirmed.map((u) => u.split(':').slice(0, 2).join(' ')).join(', ')}</p>
      )}
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {FIELDS.map(([key, label, rows]) => (
          <label key={key} className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            {label}
            <textarea rows={rows} value={draft[key]} onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))} lang={key.endsWith('Bn') ? 'bn' : 'en'} className={field} />
          </label>
        ))}
      </div>
      {error && <p role="alert" className="mt-2 text-sm text-rose-600">{error}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" disabled={busy} onClick={() => save(true)} className={`${btn} bg-emerald-600 text-white`}>{dirty ? 'Save & mark reviewed' : 'Mark Bengali reviewed'}</button>
        {dirty && <button type="button" disabled={busy} onClick={() => save(false)} className={`${btn} bg-white ring-1 ring-slate-300 dark:bg-slate-900 dark:text-white`}>Save changes only</button>}
        {reviewed && !dirty && <button type="button" disabled={busy} onClick={reopen} className={`${btn} bg-white ring-1 ring-slate-300 dark:bg-slate-900 dark:text-white`}>Send back to pending</button>}
      </div>
      {word.editHistory.length > 0 && (
        <details className="mt-3 text-xs text-slate-500">
          <summary>Edit history ({word.editHistory.length})</summary>
          <ul className="mt-1 space-y-1">
            {word.editHistory.slice().reverse().map((h) => (
              <li key={h.at}>{new Date(h.at).toLocaleString()} · {h.by}: {h.changes.map((c) => `${c.field} “${c.from}” → “${c.to}”`).join('; ')}</li>
            ))}
          </ul>
        </details>
      )}
    </article>
  );
}

/** Admin › Bengali review: unreviewed Bengali meanings, most important first. */
export default function AdminVocabularyReview() {
  const [status, setStatus] = useState('PENDING');
  const [q, setQ] = useState('');
  const [offset, setOffset] = useState(0);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const limit = 10;

  const load = useCallback(() => {
    const qs = new URLSearchParams({ status, offset: String(offset), limit: String(limit) });
    if (q.trim()) qs.set('q', q.trim());
    request(`/admin/vocabulary/bengali-review?${qs}`).then((d) => { setData(d); setError(''); }).catch((e) => setError(e.message));
  }, [status, offset, q]);
  useEffect(load, [load]);

  return (
    <div>
      <p className="mb-3 text-sm text-slate-600 dark:text-slate-300">
        Check each Bengali meaning, explanation and example. Correct them if needed, then mark the word reviewed; your name and the date are recorded.
        Official exam words and commonly tested words come first.
        {data && <> Pending: <strong>{data.counts.pending}</strong> · Reviewed: <strong>{data.counts.reviewed}</strong></>}
      </p>
      <div className="mb-4 flex flex-wrap gap-2">
        {['PENDING', 'REVIEWED'].map((s) => (
          <button key={s} type="button" onClick={() => { setStatus(s); setOffset(0); }} className={`${btn} ${s === status ? 'bg-indigo-600 text-white' : 'bg-white ring-1 ring-slate-300 dark:bg-slate-900 dark:text-white'}`}>{s.toLowerCase()}</button>
        ))}
        <input value={q} onChange={(e) => { setQ(e.target.value); setOffset(0); }} placeholder="Find a word" aria-label="Find a word" className="min-h-9 flex-1 rounded-lg border border-slate-300 px-3 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
      </div>
      {error && <p role="alert" className="mb-3 text-sm text-rose-600">{error}</p>}
      <div className="space-y-3">
        {data?.words.map((w) => <ReviewCard key={`${w.id}:${w.bengaliReview.status}:${w.editHistory.length}`} word={w} onSaved={load} />)}
        {data && data.words.length === 0 && <p className="text-slate-500">Nothing in this queue.</p>}
      </div>
      {data && data.total > limit && (
        <div className="mt-4 flex items-center gap-2 text-sm">
          <button type="button" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - limit))} className={`${btn} bg-white ring-1 ring-slate-300 dark:bg-slate-900 dark:text-white`}>Previous</button>
          <span className="text-slate-500">{offset + 1}–{Math.min(offset + limit, data.total)} of {data.total}</span>
          <button type="button" disabled={offset + limit >= data.total} onClick={() => setOffset(offset + limit)} className={`${btn} bg-white ring-1 ring-slate-300 dark:bg-slate-900 dark:text-white`}>Next</button>
        </div>
      )}
    </div>
  );
}
