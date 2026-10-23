import { useId, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { EXAM_INFO, minutesShort, negativeLabel } from '../../lib/i18n';
import { paths } from '../../lib/routes';
import { Localized } from '../topic-hub/Localized';

const fmt = (n) => (Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100));
// 1/3 marks show as a fraction, the way WBCS students know it.
const fmtNegative = (x) => (Math.abs(x - 1 / 3) < 0.001 ? '⅓' : fmt(x));

/** Negative marking for the whole stage: one value, none, "varies", or the notice's wording. */
function stageNegative(stage) {
  if (stage.negativeNote) return stage.negativeNote;
  const values = [...new Set(stage.sections.map((s) => s.negative ?? 0))];
  if (values.length > 1) return EXAM_INFO.varies;
  return values[0] ? negativeLabel(fmtNegative(values[0])) : EXAM_INFO.noNegative;
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800/60">
      <Localized value={label} as="div" className="text-xs text-slate-500 dark:text-slate-400" />
      <div className="mt-0.5 text-base font-semibold tabular-nums text-slate-900 dark:text-white">
        {typeof value === 'object' ? <Localized value={value} /> : value}
      </div>
    </div>
  );
}

function SourceLink({ href, news, label = EXAM_INFO.source }) {
  if (!href) return null;
  let host = href;
  try {
    host = new URL(href).hostname.replace(/^www\./, '');
  } catch {
    /* show the raw value */
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-indigo-700 underline-offset-2 hover:underline dark:text-indigo-300">
      <Localized value={label} />: {host}
      {news && (
        <>
          {' '}(<Localized value={EXAM_INFO.newsSource} />)
        </>
      )}
    </a>
  );
}

function PatternTable({ stage, category, bankCounts }) {
  const hasSectional = stage.sections.some((s) => s.sectionalMin);
  const hasSessions = stage.sections.some((s) => s.session);
  // Several sections can draw on one subject of ours (WBCS: six GS papers); show its count once.
  const shown = new Set();
  return (
    <div className="-mx-1 overflow-x-auto">
      <table className="w-full min-w-[22rem] text-left text-sm">
        <thead className="text-xs text-slate-500 dark:text-slate-400">
          <tr>
            <th scope="col" className="px-1 py-1.5 font-medium"><Localized value={EXAM_INFO.section} /></th>
            <th scope="col" className="px-1 py-1.5 text-right font-medium"><Localized value={EXAM_INFO.qs} /></th>
            <th scope="col" className="px-1 py-1.5 text-right font-medium"><Localized value={EXAM_INFO.marks} /></th>
            {hasSectional && <th scope="col" className="px-1 py-1.5 text-right font-medium"><Localized value={EXAM_INFO.sectional} /></th>}
            <th scope="col" className="px-1 py-1.5 text-right font-medium"><Localized value={EXAM_INFO.ourBank} /></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 tabular-nums dark:divide-slate-800">
          {stage.sections.map((s, i) => {
            const first = !shown.has(s.subject);
            shown.add(s.subject);
            const count = bankCounts.get(s.subject);
            const newSession = hasSessions && s.session !== stage.sections[i - 1]?.session;
            return [
              newSession && (
                <tr key={`session-${s.session}`}>
                  <th colSpan={5} scope="colgroup" className="px-1 pt-3 pb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
                    <Localized value={EXAM_INFO.session(s.session)} />
                  </th>
                </tr>
              ),
              <tr key={i}>
                <th scope="row" className="px-1 py-1.5 font-normal text-slate-800 dark:text-slate-100">
                  <Localized value={s.title} />
                  {s.note && <Localized value={s.note} as="div" className="text-xs text-slate-500 dark:text-slate-400" />}
                </th>
                <td className="px-1 py-1.5 text-right">{s.questions}</td>
                <td className="px-1 py-1.5 text-right">
                  {fmt(s.marks ?? s.questions * s.marksEach)}
                  {s.negative > 0 && <span className="block text-xs text-slate-500 dark:text-slate-400">−{fmtNegative(s.negative)}</span>}
                </td>
                {hasSectional && <td className="whitespace-nowrap px-1 py-1.5 text-right">{s.sectionalMin ? <Localized value={minutesShort(s.sectionalMin)} /> : '—'}</td>}
                <td className="px-1 py-1.5 text-right">
                  {first && count != null ? (
                    <Link to={paths.subject(category, s.subject)} className="font-semibold text-indigo-700 hover:underline dark:text-indigo-300">
                      {count.toLocaleString('en-IN')}
                    </Link>
                  ) : (
                    <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">{first ? '—' : '↑'}</span>
                  )}
                </td>
              </tr>,
            ];
          })}
        </tbody>
        <tfoot className="border-t border-slate-200 font-semibold tabular-nums text-slate-900 dark:border-slate-700 dark:text-white">
          <tr>
            <th scope="row" className="px-1 py-1.5"><Localized value={EXAM_INFO.total} /></th>
            <td className="px-1 py-1.5 text-right">{stage.totalQuestions}</td>
            <td className="px-1 py-1.5 text-right">{fmt(stage.totalMarks)}</td>
            {hasSectional && <td className="whitespace-nowrap px-1 py-1.5 text-right">{stage.durationMin ? <Localized value={minutesShort(stage.durationMin)} /> : ''}</td>}
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function ExamDetail({ exam, category, website, bankCounts }) {
  const stage = exam.stages[0];
  return (
    <div className="space-y-5">
      {exam.fullName && <Localized value={exam.fullName} as="p" className="text-sm font-medium text-slate-700 dark:text-slate-200" />}

      {stage ? (
        <>
          <div className="grid grid-cols-2 gap-2">
            <Stat label={EXAM_INFO.questions} value={stage.totalQuestions} />
            <Stat label={EXAM_INFO.marks} value={fmt(stage.totalMarks)} />
            <Stat label={EXAM_INFO.duration} value={stage.durationMin ? minutesShort(stage.durationMin) : '—'} />
            <Stat label={EXAM_INFO.negative} value={stageNegative(stage)} />
          </div>

          <section>
            <h3 className="mb-1 text-sm font-semibold text-slate-900 dark:text-white">
              <Localized value={EXAM_INFO.pattern} /> · <Localized value={stage.name} />
              {stage.mode && (
                <span className="ml-1 text-xs font-normal text-slate-500">
                  (<Localized value={EXAM_INFO.modes[stage.mode] ?? { en: stage.mode }} />)
                </span>
              )}
            </h3>
            <PatternTable stage={stage} category={category} bankCounts={bankCounts} />
            {stage.note && <Localized value={stage.note} as="p" className="mt-2 text-xs text-slate-600 dark:text-slate-300" />}
            {stage.languagesNote && <Localized value={stage.languagesNote} as="p" className="mt-1 text-xs text-slate-600 dark:text-slate-300" />}
          </section>
        </>
      ) : exam.selectionNote ? (
        <Localized value={exam.selectionNote} as="p" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-100" />
      ) : (
        <Localized value={EXAM_INFO.patternPending} as="p" className="text-sm text-slate-500 dark:text-slate-400" />
      )}

      {exam.nextStages.length > 0 && (
        <section>
          <Localized value={EXAM_INFO.afterThis} as="h3" className="mb-1 text-sm font-semibold text-slate-900 dark:text-white" />
          <ol className="flex flex-wrap items-center gap-1.5 text-xs">
            {exam.nextStages.map((s, i) => (
              <li key={i} className="flex items-center gap-1.5">
                {i > 0 && <span aria-hidden="true" className="text-slate-400">→</span>}
                <Localized value={s} className="rounded-md bg-slate-100 px-2 py-0.5 text-slate-700 dark:bg-slate-800 dark:text-slate-200" />
              </li>
            ))}
          </ol>
        </section>
      )}

      <section>
        <Localized value={EXAM_INFO.pastExams} as="h3" className="mb-1 text-sm font-semibold text-slate-900 dark:text-white" />
        {exam.cycles.length ? (
          <ul className="divide-y divide-slate-100 text-sm dark:divide-slate-800">
            {exam.cycles.map((c, i) => (
              <li key={i} className="py-2">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {c.year} · <Localized value={c.stage} />
                  </span>
                  {c.vacancies != null && (
                    <span className="text-xs tabular-nums text-slate-600 dark:text-slate-300">
                      <Localized value={EXAM_INFO.vacancies} />: <b>{c.vacancies.toLocaleString('en-IN')}</b>
                      {c.vacanciesNote && <> (<Localized value={c.vacanciesNote} />)</>}
                    </span>
                  )}
                </div>
                {c.dates && (
                  <div className="text-slate-700 dark:text-slate-200">
                    <Localized value={EXAM_INFO.dates} />: {c.dates}
                  </div>
                )}
                {c.note && <Localized value={c.note} as="div" className="text-xs text-slate-500 dark:text-slate-400" />}
                <div className="text-xs">
                  <SourceLink href={c.sourceUrl} news={c.sourceType === 'news'} />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <Localized value={EXAM_INFO.datesPending} as="p" className="text-sm text-slate-500 dark:text-slate-400" />
        )}
      </section>

      {exam.notes && <Localized value={exam.notes} as="p" className="text-sm text-slate-700 dark:text-slate-200" />}

      <footer className="space-y-1 border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
        {exam.patternAsOf && <Localized value={EXAM_INFO.asOf(exam.patternAsOf)} as="p" />}
        <p className="flex flex-col gap-0.5">
          <SourceLink href={exam.sourceUrl} label={EXAM_INFO.patternSource} />
          {website && website !== exam.sourceUrl && <SourceLink href={website} label={EXAM_INFO.officialSite} />}
        </p>
        <Localized value={EXAM_INFO.verify} as="p" />
      </footer>
    </div>
  );
}

/**
 * Tabbed "About the exam" panel for a category: one tab per exam (CGL / CHSL /
 * MTS), with its first-stage pattern, our question counts per section, past
 * cycles and sources. The open tab lives in ?exam= so it survives reloads.
 */
export default function ExamInfoPanel({ category, exams, website, subjects, className = '' }) {
  const [params, setParams] = useSearchParams();
  const baseId = useId();
  const tabRefs = useRef([]);
  if (!exams?.length) return null;

  const requested = params.get('exam');
  const index = Math.max(0, exams.findIndex((e) => e.code === requested));
  const exam = { stages: [], nextStages: [], cycles: [], ...exams[index] };
  const bankCounts = new Map(subjects.map((s) => [s.code, s.questionCount]));

  const select = (i, focus = false) => {
    const next = new URLSearchParams(params);
    next.set('exam', exams[i].code);
    setParams(next, { replace: true, preventScrollReset: true });
    if (focus) tabRefs.current[i]?.focus();
  };
  const onKeyDown = (e) => {
    const moves = { ArrowRight: 1, ArrowLeft: -1, Home: -index, End: exams.length - 1 - index };
    if (!(e.key in moves)) return;
    e.preventDefault();
    select((index + moves[e.key] + exams.length) % exams.length, true);
  };

  return (
    <section aria-labelledby={`${baseId}-h`} className={`rounded-2xl bg-white p-4 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800 ${className}`}>
      <h2 id={`${baseId}-h`} className="text-base font-semibold text-slate-900 dark:text-white">
        <Localized value={EXAM_INFO.heading} />
      </h2>
      <div role="tablist" aria-label={EXAM_INFO.tabsLabel.en} onKeyDown={onKeyDown} className="mt-3 flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
        {exams.map((e, i) => (
          <button
            key={e.code}
            ref={(el) => (tabRefs.current[i] = el)}
            type="button"
            role="tab"
            id={`${baseId}-tab-${e.code}`}
            aria-selected={i === index}
            aria-controls={`${baseId}-panel`}
            tabIndex={i === index ? 0 : -1}
            onClick={() => select(i)}
            className={`min-h-10 flex-1 rounded-lg px-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-indigo-500 ${
              i === index
                ? 'bg-white text-indigo-700 shadow-sm dark:bg-slate-950 dark:text-indigo-300'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
            }`}
          >
            <Localized value={e.name} />
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`${baseId}-panel`} aria-labelledby={`${baseId}-tab-${exam.code}`} tabIndex={0} className="mt-4 focus-visible:outline-none">
        <ExamDetail exam={exam} category={category} website={website} bankCounts={bankCounts} />
      </div>
    </section>
  );
}
