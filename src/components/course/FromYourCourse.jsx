import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useOptionalAuth } from '../../app/AuthContext';
import { COURSE, courseApi } from '../../lib/course';
import { Localized } from '../topic-hub/Localized';

/**
 * Chapter page card: the parts of the student's own course PDFs that cover this chapter
 * ("Mathematics book · pages 412–447"). Signed-in students only; hidden when there are none.
 */
export default function FromYourCourse({ subject, topic, className = '' }) {
  const auth = useOptionalAuth();
  const [sections, setSections] = useState([]);
  useEffect(() => {
    if (!auth?.user || !subject || !topic) return undefined;
    let live = true;
    courseApi.forTopic(subject, topic).then((d) => live && setSections(d.sections)).catch(() => {});
    return () => {
      live = false;
    };
  }, [auth?.user, subject, topic]);
  if (!sections.length) return null;
  return (
    <section aria-labelledby="from-your-course" className={`rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5 dark:bg-slate-900 dark:ring-slate-800 ${className}`}>
      <h2 id="from-your-course" className="text-lg font-bold text-slate-900 dark:text-white"><Localized value={COURSE.fromCourse} /></h2>
      <Localized value={COURSE.fromCourseSub} as="p" className="text-sm text-slate-600 dark:text-slate-300" />
      <ul className="mt-3 space-y-2">
        {sections.map((s) => (
          <li key={s.id}>
            <Link to={`/my-course/${s.fileId}?page=${s.from}`} className="flex min-h-11 items-center justify-between gap-2 rounded-xl bg-indigo-50 px-3 py-2 text-sm ring-1 ring-indigo-200 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:ring-indigo-500/30">
              <span className="font-semibold text-indigo-800 dark:text-indigo-200">{s.fileTitle}</span>
              <span className="shrink-0 text-xs text-slate-600 dark:text-slate-300">
                <Localized value={COURSE.pagesRange(s.from, s.to)} />
                {s.readPages > 0 && <> · {s.readPages >= s.pages ? '✓' : <Localized value={COURSE.readOf(s.readPages, s.pages)} />}</>} →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
