import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../app/AuthContext';
import PageShell from '../components/navigation/PageShell';
import { Localized } from '../components/topic-hub/Localized';
import { loginPath } from '../components/auth/AccountButton';
import { COURSE, courseApi, needsCheck } from '../lib/course';
import { ChapterBar, PageMarks, PageTools, ReadBar } from '../components/course/ReaderTools';

const READ_AFTER_MS = 8000; // a page counts as read after this long on screen

/** The file with one more page read (counts on the file and its section). */
function withRead(file, page) {
  if (file.readList?.includes(page)) return file;
  return {
    ...file,
    readList: [...(file.readList || []), page],
    readPages: (file.readPages || 0) + 1,
    sections: file.sections.map((s) => (page >= s.from && page <= s.to ? { ...s, readPages: (s.readPages || 0) + 1 } : s)),
  };
}

/** The file with this page's ⭐/note replaced (or dropped when both are empty). */
function withMark(file, m) {
  const rest = (file.marks || []).filter((x) => x.page !== m.page);
  const marks = m.bookmarked || m.note ? [...rest, { page: m.page, bookmarked: m.bookmarked, note: m.note }].sort((a, b) => a.page - b.page) : rest;
  return { ...file, marks };
}

const PdfPage = lazy(() => import('../components/course/PdfPage'));
const card = 'rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800';
const btn = 'inline-flex min-h-11 items-center justify-center rounded-xl px-3 text-sm font-semibold sm:min-h-10';

/** Edit or add one chapter part: chapter (or "Other" with a name) and its page range. */
function SectionForm({ file, choices, initial, onSave, onCancel }) {
  const [v, setV] = useState(initial);
  const topics = choices?.[v.subject || file.subject || 'quant']?.topics ?? [];
  const set = (k) => (e) => setV((x) => ({ ...x, [k]: e.target.value }));
  return (
    <form
      className="mt-2 space-y-2 rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-800/60"
      onSubmit={(e) => {
        e.preventDefault();
        onSave({ subject: v.subject || file.subject, topic: v.topic || null, label: v.topic ? null : v.label || null, from: Number(v.from), to: Number(v.to) });
      }}
    >
      <label className="block">
        <Localized value={COURSE.chapterLabel} className="text-xs font-semibold text-slate-500" />
        <select value={v.topic || ''} onChange={set('topic')} className="mt-0.5 min-h-10 w-full rounded-lg border-0 bg-white px-2 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
          <option value="">{COURSE.otherLabel.en} / {COURSE.otherLabel.bn}</option>
          {topics.map((t) => <option key={t.topic} value={t.topic}>{t.name.bn} ({t.name.en})</option>)}
        </select>
      </label>
      {!v.topic && <input value={v.label || ''} onChange={set('label')} maxLength={120} placeholder="e.g. Geometry / জ্যামিতি" className="min-h-10 w-full rounded-lg border-0 bg-white px-2 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700" />}
      <div className="flex gap-2">
        <label className="flex-1"><Localized value={COURSE.from} className="text-xs font-semibold text-slate-500" /><input type="number" min={1} max={file.pages} value={v.from} onChange={set('from')} className="mt-0.5 min-h-10 w-full rounded-lg border-0 bg-white px-2 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700" /></label>
        <label className="flex-1"><Localized value={COURSE.to} className="text-xs font-semibold text-slate-500" /><input type="number" min={1} max={file.pages} value={v.to} onChange={set('to')} className="mt-0.5 min-h-10 w-full rounded-lg border-0 bg-white px-2 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700" /></label>
      </div>
      <div className="flex gap-2">
        <button type="submit" className={`${btn} bg-indigo-600 text-white hover:bg-indigo-500`}><Localized value={COURSE.save} /></button>
        <button type="button" onClick={onCancel} className={`${btn} ring-1 ring-slate-300 dark:ring-slate-600`}><Localized value={COURSE.cancel} /></button>
      </div>
    </form>
  );
}

function Sections({ file, page, onGo, onChange }) {
  const [editing, setEditing] = useState(null); // section id | 'new'
  const [choices, setChoices] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    courseApi.chapters().then((d) => setChoices(d.subjects)).catch(() => {});
  }, []);
  async function save(fn) {
    setError('');
    try {
      onChange(await fn());
      setEditing(null);
    } catch (e) {
      setError(e.message);
    }
  }
  return (
    <section className={card} aria-labelledby="course-chapters">
      <h2 id="course-chapters" className="text-base font-bold text-slate-900 dark:text-white"><Localized value={COURSE.chapters} /></h2>
      {error && <p role="alert" className="mt-2 text-xs text-rose-700">{error}</p>}
      {file.sections.some(needsCheck) && (
        <div className="mt-2 rounded-xl bg-amber-50 p-3 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:ring-amber-500/30" data-testid="check-list">
          <Localized value={COURSE.checkTitle(file.sections.filter(needsCheck).length)} as="p" className="text-sm font-bold text-amber-900 dark:text-amber-200" />
          <Localized value={COURSE.checkSub} as="p" className="mt-0.5 text-xs text-amber-800 dark:text-amber-300" />
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {file.sections.filter(needsCheck).map((s) => (
              <li key={s.id}>
                <button type="button" onClick={() => { onGo(s.from); setEditing(s.id); }} className="inline-flex min-h-9 items-center rounded-lg bg-white px-2 text-xs font-semibold text-amber-900 ring-1 ring-amber-300 hover:bg-amber-100 dark:bg-slate-900 dark:text-amber-200">
                  <Localized value={s.name} />&nbsp;·&nbsp;<Localized value={COURSE.pagesRange(s.from, s.to)} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      <ul className="mt-2 space-y-1">
        {file.sections.map((s) => {
          const here = page >= s.from && page <= s.to;
          return (
            <li key={s.id}>
              <div className={`flex items-center gap-2 rounded-lg px-2 py-1 ${here ? 'bg-indigo-50 ring-1 ring-indigo-200 dark:bg-indigo-500/10 dark:ring-indigo-500/30' : ''}`}>
                <button type="button" onClick={() => onGo(s.from)} className="min-h-10 flex-1 text-left text-sm">
                  <Localized value={s.name} className="font-semibold text-slate-900 dark:text-white" />
                  <span className="block text-xs text-slate-500">
                    <Localized value={COURSE.pagesRange(s.from, s.to)} />
                    {s.readPages > 0 && <> · {s.readPages >= s.pages ? '✓' : <Localized value={COURSE.readOf(s.readPages, s.pages)} />}</>}
                    {s.source === 'filename' && <> · <Localized value={COURSE.fromName} /></>}
                    {s.source === 'toc' && <> · <Localized value={COURSE.fromToc} /></>}
                    {needsCheck(s) && <> · ⚠️ <Localized value={COURSE.unsure} /></>}
                  </span>
                  <ReadBar read={s.readPages || 0} total={s.pages} className="mt-1" />
                </button>
                <button type="button" onClick={() => setEditing(editing === s.id ? null : s.id)} className="text-xs font-semibold text-indigo-700 hover:underline dark:text-indigo-300"><Localized value={COURSE.edit} /></button>
              </div>
              {editing === s.id && (
                <>
                  <SectionForm file={file} choices={choices} initial={{ subject: s.subject, topic: s.topic || '', label: s.label || '', from: s.from, to: s.to }} onCancel={() => setEditing(null)} onSave={(body) => save(() => courseApi.updateSection(s.id, body))} />
                  <button type="button" onClick={() => window.confirm(`${COURSE.confirmRemoveSection.en}\n${COURSE.confirmRemoveSection.bn}`) && save(() => courseApi.deleteSection(s.id))} className="mt-1 text-xs font-semibold text-rose-700 hover:underline"><Localized value={COURSE.remove} /></button>
                </>
              )}
            </li>
          );
        })}
      </ul>
      {editing === 'new' ? (
        <SectionForm file={file} choices={choices} initial={{ subject: file.subject, topic: '', label: '', from: page, to: Math.min(file.pages, page + 9) }} onCancel={() => setEditing(null)} onSave={(body) => save(() => courseApi.addSection(file.id, body))} />
      ) : (
        <button type="button" onClick={() => setEditing('new')} className="mt-2 text-sm font-semibold text-indigo-700 hover:underline dark:text-indigo-300"><Localized value={COURSE.addPart} /></button>
      )}
    </section>
  );
}

/**
 * /my-course/:id?page=N: read one course PDF page by page (the original page, not converted
 * text), jump by chapter, fix the chapter split. The last page read is remembered.
 */
export default function CourseReaderPage() {
  const { id } = useParams();
  const [params, setParams] = useSearchParams();
  const { user, status: authStatus } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [jump, setJump] = useState('');
  const page = Math.max(1, Number(params.get('page')) || file?.lastPage || 1);
  const headers = useMemo(() => courseApi.pdfHeaders(), []);
  const saveTimer = useRef(null);

  useEffect(() => {
    if (user) courseApi.get(id).then(setFile).catch((e) => setError(e.message));
  }, [user, id]);

  // Remember where the student is, a moment after they stop turning pages.
  useEffect(() => {
    if (!file) return undefined;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => courseApi.lastPage(id, page).catch(() => {}), 1500);
    return () => clearTimeout(saveTimer.current);
  }, [file, id, page]);

  const go = useCallback((p) => {
    if (!file) return;
    setParams({ page: String(Math.min(Math.max(1, p), file.pages || 1)) }, { replace: true });
    window.scrollTo?.({ top: 0 });
  }, [file, setParams]);

  // A page counts as read after a few seconds on screen (not on a quick flip past it).
  useEffect(() => {
    if (!file || file.readList?.includes(page)) return undefined;
    const t = setTimeout(() => {
      courseApi.markPage(id, page, { read: true }).then(() => setFile((f) => (f ? withRead(f, page) : f))).catch(() => {});
    }, READ_AFTER_MS);
    return () => clearTimeout(t);
  }, [file, id, page]);

  // Arrow keys turn pages.
  useEffect(() => {
    const onKey = (e) => {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target?.tagName)) return;
      if (e.key === 'ArrowRight') go(page + 1);
      if (e.key === 'ArrowLeft') go(page - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, page]);

  if (authStatus === 'ready' && !user) return <Navigate to={loginPath(location)} replace />;
  const current = file?.sections.find((s) => page >= s.from && page <= s.to);

  return (
    <PageShell className="max-w-6xl pb-16 pt-4 sm:pt-6">
      <Link to="/my-course" className="inline-flex min-h-10 items-center text-sm font-semibold text-indigo-700 hover:underline dark:text-indigo-300">← <Localized value={COURSE.back} className="ml-1" /></Link>
      {error && <p role="alert" className="mt-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
      {file && (
        <div className="mt-2 grid gap-4 lg:grid-cols-[18rem_1fr]">
          <aside className="order-2 min-w-0 space-y-3 lg:order-1">
            <Sections file={file} page={page} onGo={go} onChange={setFile} />
            <PageMarks file={file} onGo={go} />
            <button
              type="button"
              onClick={async () => {
                if (!window.confirm(`${COURSE.confirmDelete.en}\n${COURSE.confirmDelete.bn}`)) return;
                await courseApi.remove(file.id).catch((e) => setError(e.message));
                navigate('/my-course');
              }}
              className="text-xs font-semibold text-rose-700 hover:underline"
            >
              <Localized value={COURSE.deleteFile} />
            </button>
            <button
              type="button"
              onClick={async () => {
                if (!window.confirm(`${COURSE.resplitConfirm.en}
${COURSE.resplitConfirm.bn}`)) return;
                await courseApi.reprocess(file.id, false).catch((e) => setError(e.message));
                navigate('/my-course');
              }}
              className="block text-xs font-semibold text-indigo-700 hover:underline dark:text-indigo-300"
            >
              <Localized value={COURSE.resplit} />
            </button>
          </aside>
          <main className="order-1 min-w-0 lg:order-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <h1 className="truncate text-lg font-bold text-slate-900 dark:text-white">{file.title}</h1>
                <p className="text-xs text-slate-500">{current && <><Localized value={current.name} /> · </>}<Localized value={COURSE.page(page)} /> / {file.pages}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => go(page - 1)} disabled={page <= 1} className={`${btn} ring-1 ring-slate-300 disabled:opacity-40 dark:ring-slate-600`}><Localized value={COURSE.prev} /></button>
                <button type="button" onClick={() => go(page + 1)} disabled={page >= file.pages} className={`${btn} bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-40`}><Localized value={COURSE.next} /></button>
                <form onSubmit={(e) => { e.preventDefault(); if (jump) go(Number(jump)); setJump(''); }} className="flex min-w-0 items-center gap-1">
                  <input type="number" min={1} max={file.pages} value={jump} onChange={(e) => setJump(e.target.value)} aria-label={COURSE.goTo.en} placeholder="#" className="min-h-10 w-20 rounded-lg border-0 bg-white px-2 text-sm ring-1 ring-slate-300 dark:bg-slate-900 dark:ring-slate-600" />
                  <button type="submit" className={`${btn} ring-1 ring-slate-300 dark:ring-slate-600`}><Localized value={COURSE.goTo} /></button>
                </form>
              </div>
            </div>
            <div className="mt-3 space-y-2">
              <label className="block lg:hidden">
                <Localized value={COURSE.chapterLabel} as="span" className="mb-1 block text-xs font-semibold text-slate-500" />
                <select
                  aria-label={COURSE.chapterLabel.en}
                  value={current?.id ?? ''}
                  onChange={(e) => {
                    const selected = file.sections.find((s) => s.id === e.target.value);
                    if (selected) go(selected.from);
                  }}
                  className="min-h-11 w-full rounded-lg border-0 bg-white px-3 text-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700"
                >
                  {!current && <option value="">{COURSE.chapterLabel.en}</option>}
                  {file.sections.map((s) => (
                    <option key={s.id} value={s.id}>{s.name.bn} ({s.name.en})</option>
                  ))}
                </select>
              </label>
              <ChapterBar file={file} section={current} onChange={setFile} />
              <PageTools file={file} page={page} onMark={(m) => setFile((f) => withMark(f, m))} />
            </div>
            <div className="mt-3">
              <Suspense fallback={<Localized value={COURSE.loadingPdf} as="p" className="p-6 text-center text-sm text-slate-500" />}>
                <PdfPage url={courseApi.pdfUrl(file.id)} headers={headers} page={page} />
              </Suspense>
            </div>
            <div className="mt-3 flex justify-between">
              <button type="button" onClick={() => go(page - 1)} disabled={page <= 1} className={`${btn} ring-1 ring-slate-300 disabled:opacity-40 dark:ring-slate-600`}><Localized value={COURSE.prev} /></button>
              <button type="button" onClick={() => go(page + 1)} disabled={page >= file.pages} className={`${btn} bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-40`}><Localized value={COURSE.next} /></button>
            </div>
          </main>
        </div>
      )}
    </PageShell>
  );
}
