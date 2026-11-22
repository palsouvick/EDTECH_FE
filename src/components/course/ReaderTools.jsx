import { useEffect, useState } from 'react';
import { COURSE, courseApi } from '../../lib/course';
import { Localized } from '../topic-hub/Localized';

const btn = 'inline-flex min-h-10 items-center justify-center rounded-xl px-3 text-sm font-semibold';

/** A thin progress bar with an accessible value. */
export function ReadBar({ read, total, className = '' }) {
  const pct = total ? Math.round((read / total) * 100) : 0;
  return (
    <div className={`h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800 ${className}`} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${read}/${total}`}>
      <div className={`h-full ${pct >= 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

/**
 * The chapter the student is in: "Profit & Loss: 12/28 pages read", a bar, and "Chapter done"
 * (marks every page of it read; "Not done yet" undoes it).
 */
export function ChapterBar({ file, section, onChange }) {
  const [busy, setBusy] = useState(false);
  if (!section) return null;
  const done = section.readPages >= section.pages;
  async function mark(read) {
    setBusy(true);
    try {
      onChange(await courseApi.markRange(file.id, { from: section.from, to: section.to, read }));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section aria-label="Chapter progress" className="rounded-xl bg-white p-3 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm">
          <Localized value={section.name} className="font-bold text-slate-900 dark:text-white" />
          <span className="text-slate-600 dark:text-slate-300">: <Localized value={COURSE.readOf(section.readPages, section.pages)} /></span>
        </p>
        <button type="button" disabled={busy} onClick={() => mark(!done)} className={`${btn} min-h-9 ${done ? 'ring-1 ring-slate-300 dark:ring-slate-600' : 'bg-emerald-600 text-white hover:bg-emerald-500'} disabled:opacity-60`}>
          <Localized value={done ? COURSE.notDone : COURSE.chapterDone} />
        </button>
      </div>
      <ReadBar read={section.readPages} total={section.pages} className="mt-2" />
    </section>
  );
}

/** ⭐ and a short note for the page on screen. */
export function PageTools({ file, page, onMark }) {
  const mark = file.marks?.find((m) => m.page === page) ?? { bookmarked: false, note: '' };
  const [note, setNote] = useState(mark.note);
  const [open, setOpen] = useState(Boolean(mark.note));
  const [saved, setSaved] = useState(false);
  // Reset only when another page comes up: saving updates mark.note, and that must not wipe the
  // "Saved ✓" confirmation or the open note box.
  useEffect(() => {
    setNote(mark.note);
    setOpen(Boolean(mark.note));
    setSaved(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  async function save(body) {
    const m = await courseApi.markPage(file.id, page, body);
    onMark(m);
    return m;
  }
  return (
    <div className="flex flex-wrap items-start gap-2">
      <button type="button" aria-pressed={mark.bookmarked} onClick={() => save({ bookmarked: !mark.bookmarked })} className={`${btn} min-h-9 ring-1 ${mark.bookmarked ? 'bg-amber-100 text-amber-900 ring-amber-300 dark:bg-amber-500/15 dark:text-amber-200' : 'ring-slate-300 dark:ring-slate-600'}`}>
        {mark.bookmarked ? '⭐' : '☆'} <Localized value={mark.bookmarked ? COURSE.bookmarked : COURSE.bookmark} className="ml-1" />
      </button>
      {!open ? (
        <button type="button" onClick={() => setOpen(true)} className={`${btn} min-h-9 ring-1 ring-slate-300 dark:ring-slate-600`}>📝 <Localized value={COURSE.addNote} className="ml-1" /></button>
      ) : (
        <form
          className="flex min-w-[16rem] flex-1 flex-wrap items-start gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            await save({ note });
            setSaved(true);
          }}
        >
          <label className="flex-1">
            <span className="sr-only">{COURSE.noteLabel.en}</span>
            <textarea value={note} onChange={(e) => { setNote(e.target.value); setSaved(false); }} maxLength={1000} rows={2} placeholder={COURSE.notePlaceholder.bn} className="w-full rounded-lg border-0 bg-white px-2 py-1 text-sm ring-1 ring-slate-300 dark:bg-slate-900 dark:ring-slate-600" />
          </label>
          <button type="submit" className={`${btn} min-h-9 bg-indigo-600 text-white hover:bg-indigo-500`}><Localized value={saved ? COURSE.noteSaved : COURSE.saveNote} /></button>
        </form>
      )}
    </div>
  );
}

/** This PDF's ⭐ pages and notes, to jump back to. */
export function PageMarks({ file, onGo }) {
  if (!file.marks?.length) return null;
  return (
    <section aria-labelledby="page-marks" className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
      <h2 id="page-marks" className="text-base font-bold text-slate-900 dark:text-white"><Localized value={COURSE.marksHere} /></h2>
      <ul className="mt-2 space-y-1">
        {file.marks.map((m) => (
          <li key={m.page}>
            <button type="button" onClick={() => onGo(m.page)} className="min-h-10 w-full rounded-lg px-2 py-1 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800">
              <span className="font-semibold text-slate-900 dark:text-white">{m.bookmarked ? '⭐ ' : '📝 '}<Localized value={COURSE.page(m.page)} /></span>
              {m.note && <span className="block truncate text-xs text-slate-600 dark:text-slate-300">{m.note}</span>}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
