import { useEffect, useState } from 'react';
import { request } from '../../lib/api';

const btn = 'min-h-9 rounded-lg px-3 text-xs font-semibold';
const input = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white';
const fmt = (d) => (d ? new Date(d).toLocaleString() : '');

/**
 * Admin question editor. Every save needs a reason and is kept in the question's
 * history (who, when, each field's old and new value). Option ids never change.
 * Changing the correct answer is flagged in the history; a source-verified question
 * that is edited goes back to "needs review" until its source is checked again.
 */
export default function QuestionEditor({ id, onClose, onSaved }) {
  const [data, setData] = useState(null);
  const [draft, setDraft] = useState(null);
  const [reason, setReason] = useState('');
  const [check, setCheck] = useState({ status: 'SOURCE_PENDING', sourceUrl: '', sourceTitle: '', note: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => request(`/admin/questions/${id}`).then((d) => {
    setData(d);
    const q = d.question;
    setDraft({ stem: { ...q.stem }, options: q.options.map((o) => ({ optionId: o.optionId, text: { ...o.text } })), correctOptionId: q.correctOptionId, steps: q.steps.map((s) => ({ en: s.en || '', bn: s.bn || '' })), difficulty: q.difficulty });
    if (q.sourceCheck?.status) setCheck({ status: q.sourceCheck.status, sourceUrl: q.sourceCheck.sourceUrl || '', sourceTitle: q.sourceCheck.sourceTitle || '', note: '' });
  }).catch((e) => setError(e.message));
  useEffect(() => { load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const run = async (fn) => {
    setBusy(true);
    setError('');
    try {
      const d = await fn();
      setData(d);
      onSaved?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const save = () => run(() => {
    const q = data.question;
    const changes = {};
    if (JSON.stringify(draft.stem) !== JSON.stringify(q.stem)) changes.stem = draft.stem;
    const opts = draft.options.filter((o, i) => JSON.stringify(o.text) !== JSON.stringify(q.options[i].text));
    if (opts.length) changes.options = opts;
    if (draft.correctOptionId !== q.correctOptionId) changes.correctOptionId = draft.correctOptionId;
    if (JSON.stringify(draft.steps) !== JSON.stringify(q.steps.map((s) => ({ en: s.en || '', bn: s.bn || '' })))) changes.steps = draft.steps.filter((s) => s.en && s.bn);
    if (draft.difficulty !== q.difficulty) changes.difficulty = draft.difficulty;
    if (!Object.keys(changes).length) throw new Error('Nothing changed');
    return request(`/admin/questions/${id}`, { method: 'PATCH', body: { reason, changes } });
  });
  const saveCheck = () => run(() => request(`/admin/questions/${id}/source-check`, { method: 'PUT', body: { status: check.status, note: check.note, ...(check.sourceUrl && { sourceUrl: check.sourceUrl }), ...(check.sourceTitle && { sourceTitle: check.sourceTitle }) } }));
  const retire = () => run(() => request(`/admin/questions/${id}/${data.question.status === 'ARCHIVED' ? 'restore' : 'retire'}`, { method: 'POST', body: { reason } }));

  return (
    <div role="dialog" aria-modal="true" aria-label="Edit question" className="fixed inset-0 z-50 flex justify-end bg-slate-950/50">
      <div className="h-full w-full max-w-3xl overflow-y-auto bg-white p-5 shadow-xl dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Edit question {data?.question.code}</h2>
          <button type="button" onClick={onClose} className={`${btn} ring-1 ring-slate-300 dark:text-white`}>Close</button>
        </div>
        {error && <p role="alert" className="mt-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
        {!draft && !error && <p className="mt-4 text-slate-500">Loading…</p>}
        {draft && data && (
          <div className="mt-4 space-y-4 text-sm">
            <p className="text-xs text-slate-500">
              {data.question.subject}/{data.question.topic} · status {data.question.status} · version {data.question.version} · {data.question.provenance}
              {data.question.retiredReason ? ` · retired: ${data.question.retiredReason}` : ''}
            </p>
            {['en', 'bn'].map((l) => (
              <label key={l} className="block">
                <span className="font-semibold">Question ({l})</span>
                <textarea rows={3} className={input} value={draft.stem[l] || ''} onChange={(e) => setDraft({ ...draft, stem: { ...draft.stem, [l]: e.target.value } })} />
              </label>
            ))}
            <fieldset>
              <legend className="font-semibold">Options (select the correct one)</legend>
              {draft.options.map((o, i) => (
                <div key={o.optionId} className="mt-2 grid grid-cols-[auto_1fr_1fr] items-center gap-2">
                  <input type="radio" name="correct" aria-label={`Option ${i + 1} is correct`} checked={draft.correctOptionId === o.optionId} onChange={() => setDraft({ ...draft, correctOptionId: o.optionId })} />
                  {['en', 'bn'].map((l) => (
                    <input key={l} aria-label={`Option ${i + 1} ${l}`} className={input} value={o.text[l] || ''} onChange={(e) => setDraft({ ...draft, options: draft.options.map((x) => (x.optionId === o.optionId ? { ...x, text: { ...x.text, [l]: e.target.value } } : x)) })} />
                  ))}
                </div>
              ))}
            </fieldset>
            {draft.steps.map((s, i) => (
              <div key={i} className="grid gap-2 sm:grid-cols-2">
                {['en', 'bn'].map((l) => (
                  <label key={l} className="block">
                    <span className="font-semibold">Explanation {i + 1} ({l})</span>
                    <textarea rows={2} className={input} value={s[l]} onChange={(e) => setDraft({ ...draft, steps: draft.steps.map((x, j) => (j === i ? { ...x, [l]: e.target.value } : x)) })} />
                  </label>
                ))}
              </div>
            ))}
            <label className="block">
              <span className="font-semibold">Difficulty (1–5)</span>
              <input type="number" min={1} max={5} className={`${input} w-24`} value={draft.difficulty} onChange={(e) => setDraft({ ...draft, difficulty: Number(e.target.value) })} />
            </label>
            <label className="block">
              <span className="font-semibold">Reason for the change (kept in the history)</span>
              <input className={input} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Corrected the year per the official notice" />
            </label>
            <div className="flex flex-wrap gap-2">
              <button type="button" disabled={busy || reason.trim().length < 3} onClick={save} className={`${btn} bg-indigo-600 text-white disabled:opacity-50`}>Save changes</button>
              <button type="button" disabled={busy || reason.trim().length < 3} onClick={retire} className={`${btn} bg-rose-100 text-rose-800 disabled:opacity-50`}>{data.question.status === 'ARCHIVED' ? 'Restore' : 'Retire'}</button>
            </div>

            {data.question.subject === 'gs' && (
              <section className="rounded-xl bg-slate-50 p-3 dark:bg-slate-950">
                <h3 className="font-semibold">Source check</h3>
                <p className="text-xs text-slate-500">Current: {data.question.sourceCheck?.status || 'SOURCE_PENDING'}. "Source verified" needs the page that supports this specific answer.</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <select className={input} value={check.status} onChange={(e) => setCheck({ ...check, status: e.target.value })}>
                    <option value="SOURCE_VERIFIED">Source verified</option>
                    <option value="SOURCE_PENDING">Source pending</option>
                    <option value="NEEDS_REVIEW">Needs review</option>
                  </select>
                  <input className={input} placeholder="Source title" value={check.sourceTitle} onChange={(e) => setCheck({ ...check, sourceTitle: e.target.value })} />
                  <input className={`${input} sm:col-span-2`} placeholder="https://… (official page)" value={check.sourceUrl} onChange={(e) => setCheck({ ...check, sourceUrl: e.target.value })} />
                  <input className={`${input} sm:col-span-2`} placeholder="Note (what you checked)" value={check.note} onChange={(e) => setCheck({ ...check, note: e.target.value })} />
                </div>
                <button type="button" disabled={busy || check.note.trim().length < 3} onClick={saveCheck} className={`${btn} mt-2 bg-emerald-600 text-white disabled:opacity-50`}>Save source check</button>
              </section>
            )}

            <section>
              <h3 className="font-semibold">History</h3>
              {data.history.length === 0 && <p className="text-slate-500">No edits yet.</p>}
              <ol className="mt-1 space-y-2">
                {data.history.map((h, i) => (
                  <li key={i} className="rounded-lg bg-slate-50 p-2 text-xs dark:bg-slate-950">
                    <b>v{h.version} {h.action}</b> by {h.by} · {fmt(h.at)}{h.answerChanged && <span className="ml-1 rounded bg-rose-100 px-1 font-bold text-rose-800">ANSWER CHANGED</span>}
                    {h.reason && <p>Reason: {h.reason}</p>}
                    <ul className="mt-1 list-disc pl-4">{h.changes.map((c, j) => <li key={j}><code>{c.field}</code></li>)}</ul>
                  </li>
                ))}
              </ol>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
