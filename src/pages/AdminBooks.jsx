import { useCallback, useEffect, useState } from 'react';
import { request } from '../lib/api';
import Dialog from '../components/practice/Dialog';

const btn = 'min-h-9 rounded-lg px-3 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-40';
const panel = 'rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800';
const fmt = (d) => (d ? new Date(d).toLocaleString() : '');
const CARD_FOR_BOOK = { history: 'indian-history', geography: 'geography' };
// One tab per subject book, in the order the books are written.
const BOOKS = [
  { code: 'history', name: 'History', icon: '🏛️' },
  { code: 'geography', name: 'Geography', icon: '🌏' },
];
const PART = {
  intro: 'Introduction',
  ancient: 'Ancient',
  medieval: 'Medieval',
  modern_company: 'Modern: Company rule',
  modern_national: 'Modern: national movement',
  post_independence: 'After 1947',
  india_land: 'India: land and rivers',
  india_resources: 'India: resources and economy',
  west_bengal: 'West Bengal',
  earth_world: 'Earth and the world',
};
const TONE = {
  VERIFIED: 'bg-emerald-100 text-emerald-800',
  NEEDS_REVIEW: 'bg-amber-100 text-amber-900',
  UNVERIFIED: 'bg-slate-200 text-slate-700',
};

/**
 * Admin Console → Books: one tab per subject book (History, Geography), every chapter with its independent-check status, and Publish /
 * Unpublish. Publishing is allowed only for VERIFIED chapters; the chapter's questions go live (or are withdrawn)
 * at once.
 */
export default function AdminBooks() {
  const [state, setState] = useState({ status: 'loading' });
  const [busy, setBusy] = useState(null);
  const [message, setMessage] = useState(null);
  const [tab, setTab] = useState(() => {
    try {
      return localStorage.getItem('admin:books:tab') || 'history';
    } catch {
      return 'history';
    }
  });
  const pickTab = (code) => {
    setTab(code);
    setMessage(null);
    try {
      localStorage.setItem('admin:books:tab', code);
    } catch {
      /* private mode: the tab just is not remembered */
    }
  };

  const load = useCallback(() => {
    request('/admin/books').then((data) => setState({ status: 'ready', data }), (error) => setState({ status: 'error', error }));
  }, []);
  useEffect(load, [load]);

  // Publish / Unpublish first opens the confirmation dialog; only its button calls the API.
  const [pending, setPending] = useState(null); // { c, action }
  const change = (c, action) => setPending({ c, action });

  async function confirmChange() {
    if (!pending) return;
    const { c, action } = pending;
    setPending(null);
    const verb = action === 'publish' ? 'Publish' : 'Unpublish';
    setBusy(c.code);
    setMessage(null);
    try {
      const r = await request(`/admin/books/${c.book}/${c.code}/${action}`, { method: 'POST' });
      setMessage({ ok: true, text: `${verb}ed ${c.code}: ${r.questionsLive} question(s) now live.` });
      load();
    } catch (e) {
      setMessage({ ok: false, text: e.message });
    } finally {
      setBusy(null);
    }
  }

  if (state.status === 'loading') return <p className="text-sm text-slate-500">Loading…</p>;
  if (state.status === 'error') return <p role="alert" className="text-sm text-rose-700">{state.error.message}</p>;
  const { chapters: all, errors: allErrors } = state.data;
  const current = BOOKS.find((b) => b.code === tab) ?? BOOKS[0];
  const chapters = all.filter((c) => c.book === current.code);
  const errors = allErrors.filter((e) => e.book === current.code);
  const written = chapters.filter((c) => c.written);
  const countOf = (code) => {
    const list = all.filter((c) => c.book === code);
    return `${list.filter((c) => c.published).length}/${list.length}`;
  };

  return (
    <div className="space-y-4">
      <div role="tablist" aria-label="Subject books" className="flex flex-wrap gap-2">
        {BOOKS.map((b) => (
          <button
            key={b.code}
            type="button"
            role="tab"
            aria-selected={tab === b.code}
            onClick={() => pickTab(b.code)}
            className={`min-h-10 rounded-full px-4 text-sm font-semibold ring-1 ${tab === b.code ? 'bg-indigo-600 text-white ring-indigo-600' : 'bg-white text-slate-700 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-700'}`}
          >
            <span aria-hidden="true">{b.icon} </span>{b.name}
            <span className={`ml-2 rounded-full px-2 py-0.5 text-xs tabular-nums ${tab === b.code ? 'bg-white/20' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`} title="published / chapters">{countOf(b.code)}</span>
          </button>
        ))}
      </div>
      <section className={panel}>
        <h2 className="font-bold text-slate-900 dark:text-white">{current.name} book</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          {written.length} of {chapters.length} chapters written · {chapters.filter((c) => c.published).length} published. A chapter can be
          published only after its independent check marks it <b>VERIFIED</b>. Use <b>Preview</b> to read a draft as students would see it.
        </p>
        {message && <p role="status" className={`mt-2 rounded-lg px-3 py-2 text-sm ${message.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>{message.text}</p>}
        {errors.length > 0 && (
          <div role="alert" className="mt-3 rounded-lg bg-rose-50 p-3 text-xs text-rose-900">
            <p className="font-semibold">Chapter files with errors (left out of the book until fixed):</p>
            <ul className="mt-1 list-disc pl-5">{errors.slice(0, 20).map((e, i) => <li key={i}><span className="font-mono">{e.file}</span>: {e.problem}</li>)}</ul>
          </div>
        )}
      </section>

      <section className={panel}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-slate-500">
              <tr><th className="py-2 pr-3">#</th><th className="pr-3">Chapter</th><th className="pr-3">Check</th><th className="pr-3">Status</th><th className="pr-3">Questions</th><th className="pr-3">PYQs</th><th className="pr-3">Last change</th><th /></tr>
            </thead>
            <tbody>
              {chapters.map((c) => (
                <tr key={c.code} className={`border-t border-slate-100 align-top dark:border-slate-800 ${c.written ? '' : 'text-slate-400'}`}>
                  <td className="py-2 pr-3 font-mono text-xs">{c.code}</td>
                  <td className="pr-3">
                    <span lang="bn" className={c.written ? 'font-semibold text-slate-900 dark:text-white' : ''}>{c.title}</span>
                    <span className="block text-xs text-slate-500">{PART[c.part]}</span>
                    {c.verification?.notes && <details className="text-xs text-slate-500"><summary className="cursor-pointer">Check notes</summary><p className="mt-1 max-w-md">{c.verification.notes}</p></details>}
                  </td>
                  <td className="pr-3">{c.verification ? <span className={`rounded px-1.5 py-0.5 text-xs font-semibold ${TONE[c.verification.status]}`}>{c.verification.status}</span> : <span className="text-xs">not written</span>}</td>
                  <td className="pr-3">
                    {c.written && <span className={`rounded px-1.5 py-0.5 text-xs font-semibold ${c.published ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'}`}>{c.published ? 'PUBLISHED' : 'DRAFT'}</span>}
                  </td>
                  <td className="pr-3 tabular-nums text-xs">{c.written ? `${c.questionsLive} live / ${c.questions}` : ''}</td>
                  <td className="pr-3 tabular-nums text-xs">{c.written ? c.pyqsTaught : ''}</td>
                  <td className="pr-3 text-xs text-slate-500">{c.decision ? <>{c.decision.status === 'PUBLISHED' ? 'Published' : 'Unpublished'} by {c.decision.by}<br />{fmt(c.decision.at)}</> : c.written ? 'From file' : ''}</td>
                  <td className="py-2">
                    {c.written && (
                      <div className="flex flex-wrap gap-1.5">
                        <a href={`/learn/gk/${CARD_FOR_BOOK[c.book]}/book/${c.code}?preview=1`} target="_blank" rel="noopener noreferrer" className={`${btn} inline-flex items-center bg-white text-indigo-700 ring-1 ring-indigo-200`}>Preview</a>
                        {c.published ? (
                          <button type="button" className={`${btn} bg-slate-200 text-slate-800`} disabled={busy === c.code} onClick={() => change(c, 'unpublish')}>Unpublish</button>
                        ) : (
                          <button type="button" className={`${btn} bg-emerald-600 text-white`} disabled={busy === c.code || !c.canPublish} title={c.canPublish ? '' : 'Needs a VERIFIED independent check first'} onClick={() => change(c, 'publish')}>Publish</button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <Dialog open={Boolean(pending)} onClose={() => setPending(null)} labelledBy="book-confirm-title">
        {pending && (
          <>
            <h2 id="book-confirm-title" className="text-lg font-bold text-slate-900 dark:text-white">
              {pending.action === 'publish' ? 'Publish this chapter?' : 'Unpublish this chapter?'}
            </h2>
            <div className="mt-3 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
              <p className="font-mono text-xs text-slate-500">{pending.c.code} · Chapter {pending.c.number}</p>
              <p lang="bn" className="mt-0.5 font-semibold text-slate-900 dark:text-white">{pending.c.title}</p>
            </div>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
              {pending.action === 'publish'
                ? <>Students will see this chapter and its <b>{pending.c.questions}</b> practice questions at once.</>
                : <>Students will no longer see this chapter, and its <b>{pending.c.questionsLive ?? pending.c.questions}</b> questions leave practice.</>}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setPending(null)} className="min-h-10 rounded-xl px-4 text-sm font-semibold text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50 dark:text-slate-200 dark:ring-slate-700 dark:hover:bg-slate-800">
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmChange}
                className={`min-h-10 rounded-xl px-5 text-sm font-semibold text-white ${pending.action === 'publish' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'}`}
              >
                {pending.action === 'publish' ? 'Yes, publish' : 'Yes, unpublish'}
              </button>
            </div>
          </>
        )}
      </Dialog>
    </div>
  );
}
