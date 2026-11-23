import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../app/AuthContext';
import PageShell from '../components/navigation/PageShell';
import { Localized } from '../components/topic-hub/Localized';
import { COURSE, courseApi, needsCheck } from '../lib/course';
import { loginPath } from '../components/auth/AccountButton';

const card = 'rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5 dark:bg-slate-900 dark:ring-slate-800';
export const coursePath = (id, page) => `/my-course/${id}${page ? `?page=${page}` : ''}`;

function StatusLine({ f }) {
  if (f.status === 'processing') {
    const pct = f.progress.total ? Math.round((f.progress.done / f.progress.total) * 100) : 0;
    return (
      <div className="mt-2">
        <Localized value={COURSE.status.processing(f.progress.done, f.progress.total || f.pages || 0)} as="p" className="text-sm font-semibold text-indigo-700 dark:text-indigo-300" />
        <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full bg-indigo-500 transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>
    );
  }
  const tone = { queued: 'text-amber-700 dark:text-amber-300', ready: 'text-emerald-700 dark:text-emerald-300', failed: 'text-rose-700 dark:text-rose-300' }[f.status];
  return <Localized value={COURSE.status[f.status]} as="p" className={`mt-2 text-sm font-semibold ${tone}`} />;
}

/** A failed file: why, in the student's language, and a retry (pointless for a locked PDF). */
function FailedNote({ f, onChanged }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const reason = COURSE.failReason[f.failReason] ? f.failReason : 'server';
  async function retry() {
    setBusy(true);
    setErr('');
    try {
      await courseApi.reprocess(f.id);
      await onChanged();
    } catch (e) {
      setErr(e.message);
      setBusy(false);
    }
  }
  return (
    <div className="mt-1">
      <Localized value={COURSE.failReason[reason]} as="p" className="text-xs text-rose-700 dark:text-rose-300" />
      {reason !== 'password' && (
        <button type="button" disabled={busy} onClick={retry} className="mt-2 inline-flex min-h-9 items-center rounded-lg bg-rose-600 px-3 text-xs font-bold text-white hover:bg-rose-500 disabled:opacity-60">
          ↻ <Localized value={busy ? COURSE.retrying : COURSE.retry} className="ml-1" />
        </button>
      )}
      {err && <p role="alert" className="mt-1 text-xs text-rose-700 dark:text-rose-300">{err}</p>}
    </div>
  );
}

function FileCard({ f, onChanged }) {
  return (
    <li className={card}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="break-words font-bold text-slate-900 dark:text-white">{f.title}</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            {f.subjectName && <><Localized value={f.subjectName} /> · </>}
            {f.pages > 0 && <><Localized value={COURSE.pages(f.pages)} /> · </>}
            {f.sizeMb} MB
            {f.kind && <> · <Localized value={COURSE.kind[f.kind]} /></>}
            {f.status === 'ready' && f.pages > 0 && f.readPages > 0 && <> · <Localized value={COURSE.readPct(Math.round((f.readPages / f.pages) * 100))} /></>}
          </p>
        </div>
        {f.status === 'ready' && (
          <Link to={coursePath(f.id, f.lastPage > 1 ? f.lastPage : null)} className="inline-flex min-h-10 items-center rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white hover:bg-indigo-500">
            <Localized value={f.lastPage > 1 ? COURSE.continueAt(f.lastPage) : COURSE.open} />
          </Link>
        )}
      </div>
      <StatusLine f={f} />
      {f.status === 'ready' && f.sections?.some(needsCheck) && <Localized value={COURSE.checkTitle(f.sections.filter(needsCheck).length)} as="p" className="mt-1 text-xs font-semibold text-amber-700 dark:text-amber-300" />}
      {f.status === 'failed' && <FailedNote f={f} onChanged={onChanged} />}
      {f.sections?.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {f.sections.map((s) => (
            <li key={s.id}>
              <Link to={coursePath(f.id, s.from)} className="inline-flex min-h-9 items-center rounded-lg bg-slate-100 px-3 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-indigo-50 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700">
                {s.readPages >= s.pages && <span aria-hidden="true" className="mr-1 text-emerald-600">✓</span>}
                <Localized value={s.name} />
                <span className="ml-1 font-normal text-slate-500">· <Localized value={COURSE.pagesRange(s.from, s.to)} /></span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

/** Every ⭐ page and note across the student's PDFs, to jump back to. */
function AllMarks() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    courseApi.bookmarks().then((d) => setItems(d.items)).catch(() => {});
  }, []);
  if (!items.length) return null;
  return (
    <section className={card} aria-labelledby="all-marks">
      <h2 id="all-marks" className="text-base font-bold text-slate-900 dark:text-white"><Localized value={COURSE.allMarks} /></h2>
      <ul className="mt-2 divide-y divide-slate-100 dark:divide-slate-800">
        {items.map((m) => (
          <li key={`${m.fileId}-${m.page}`}>
            <Link to={coursePath(m.fileId, m.page)} className="block py-2 hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">{m.bookmarked ? '⭐ ' : '📝 '}{m.fileTitle} · <Localized value={COURSE.page(m.page)} />{m.chapter && <> · <Localized value={m.chapter} /></>}</span>
              {m.note && <span className="mt-0.5 block text-xs text-slate-600 dark:text-slate-300">{m.note}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Search() {
  const [q, setQ] = useState('');
  const [res, setRes] = useState(null);
  const timer = useRef(null);
  useEffect(() => {
    clearTimeout(timer.current);
    if (q.trim().length < 2) {
      setRes(null);
      return undefined;
    }
    timer.current = setTimeout(() => courseApi.search(q.trim()).then(setRes).catch(() => setRes({ hits: [] })), 350);
    return () => clearTimeout(timer.current);
  }, [q]);
  return (
    <section className={card} aria-label="Search">
      <label className="block">
        <span className="sr-only"><Localized value={COURSE.searchPlaceholder} /></span>
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={`🔍 ${COURSE.searchPlaceholder.en}`} className="min-h-11 w-full rounded-xl border-0 bg-slate-50 px-4 text-sm ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 dark:bg-slate-800 dark:ring-slate-700" />
      </label>
      {res && !res.hits.length && <Localized value={COURSE.noHits} as="p" className="mt-3 text-sm text-slate-500" />}
      {res?.hits.length > 0 && (
        <ul className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
          {res.hits.map((h) => (
            <li key={`${h.fileId}-${h.page}`}>
              <Link to={coursePath(h.fileId, h.page)} className="block py-2 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">{h.fileTitle} · <Localized value={COURSE.page(h.page)} /></span>
                <span className="mt-0.5 block text-xs text-slate-600 dark:text-slate-300">{h.snippet}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/**
 * /my-course: the student's own course PDFs. Add a PDF -> it is read page by page (text layer
 * or OCR on the server) and split into chapters; search across all of them.
 */
export default function MyCoursePage() {
  const { user, status: authStatus } = useAuth();
  const location = useLocation();
  const [files, setFiles] = useState(null);
  const [error, setError] = useState('');
  const [duplicate, setDuplicate] = useState(null); // { fileId, title } of the copy already there
  const [upload, setUpload] = useState(null); // 0..1 while uploading
  const input = useRef(null);

  const load = useCallback(() => courseApi.list().then((d) => setFiles(d.files)).catch((e) => setError(e.message)), []);
  useEffect(() => {
    if (user) load();
  }, [user, load]);
  // While a file is being read, refresh its progress every few seconds.
  const busy = files?.some((f) => f.status === 'queued' || f.status === 'processing');
  useEffect(() => {
    if (!busy) return undefined;
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, [busy, load]);

  if (authStatus === 'ready' && !user) return <Navigate to={loginPath(location)} replace />;

  async function onPick(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    setDuplicate(null);
    setUpload(0);
    try {
      await courseApi.upload(file, setUpload);
      await load();
    } catch (err) {
      if (err.code === 'DUPLICATE_PDF' && err.details) setDuplicate(err.details);
      else setError(err.message);
    } finally {
      setUpload(null);
    }
  }

  return (
    <PageShell className="max-w-4xl space-y-5 pb-16 pt-6 sm:pt-8">
      <header>
        <Localized value={COURSE.title} as="h1" className="text-2xl font-extrabold text-slate-900 sm:text-3xl dark:text-white" />
        <Localized value={COURSE.sub} as="p" className="mt-2 text-sm text-slate-600 dark:text-slate-300" />
      </header>
      <div className="flex flex-wrap items-center gap-3">
        <input ref={input} type="file" accept="application/pdf,.pdf" className="hidden" onChange={onPick} data-testid="course-file-input" />
        <button type="button" disabled={upload !== null} onClick={() => input.current?.click()} className="inline-flex min-h-11 items-center rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white hover:bg-indigo-500 disabled:opacity-60">
          📄 <Localized value={upload !== null ? COURSE.uploading(Math.round(upload * 100)) : COURSE.add} className="ml-1" />
        </button>
        {busy && <Localized value={COURSE.slowNote} as="p" className="max-w-xl text-xs text-slate-500" />}
      </div>
      {duplicate && (
        <p role="status" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-200 dark:ring-amber-500/30">
          <Localized value={COURSE.duplicate(duplicate.title)} />{' '}
          {duplicate.status === 'ready' && <Link to={coursePath(duplicate.fileId)} className="font-bold underline"><Localized value={COURSE.openExisting} /></Link>}
        </p>
      )}
      {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800 dark:bg-rose-500/10 dark:text-rose-200">{error}</p>}
      {files?.some((f) => f.status === 'ready') && <Search />}
      {files?.some((f) => f.status === 'ready') && <AllMarks />}
      {files === null && !error && <p aria-busy="true" className="h-32 animate-pulse rounded-2xl bg-slate-200/60 dark:bg-slate-800" />}
      {files?.length === 0 && <Localized value={COURSE.empty} as="p" className={`${card} text-slate-600 dark:text-slate-300`} />}
      {files?.length > 0 && <ul className="space-y-3">{files.map((f) => <FileCard key={f.id} f={f} onChanged={load} />)}</ul>}
    </PageShell>
  );
}
