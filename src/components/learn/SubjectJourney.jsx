import { Link } from 'react-router-dom';
import { COACH, JOURNEY_COPY } from '../../lib/ladderCopy';
import { band, chapterFacts, JOURNEY, journeyStage, ladderFor, repairTopics } from '../../lib/ladder';
import { learnPaths } from '../../lib/routes';
import { Localized } from '../topic-hub/Localized';
import { useLearnStatus } from './useLearnStatus';

const box = 'rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5 dark:bg-slate-900 dark:ring-slate-800';
const chapterLink = (subject, topic, mode) => `${learnPaths.chapter(subject, topic)}${mode ? `?mode=${mode}` : ''}`;

/**
 * Learn → Math / English: where the student is on the Zero → Exam-ready journey, the next
 * chapter to study, accuracy per chapter with the weakest one to fix first, and a repair
 * set when one chapter collects three mistakes in a week.
 *
 * @param {{ subject: string, chapters: { topic: string, title: {en,bn} }[] }} props
 */
export default function SubjectJourney({ subject, chapters }) {
  const status = useLearnStatus(subject);
  if (!status.ready || !chapters?.length) return null;

  const rows = chapters.map((c) => {
    const facts = chapterFacts(subject, c.topic, { mastery: status.mastery[c.topic], pyq: status.signedIn ? status.pyq[c.topic] ?? { total: 0, attempted: 0, solved: 0 } : null });
    return { ...c, ladder: ladderFor(facts), mastery: status.mastery[c.topic] };
  });
  const { stage, index } = journeyStage(rows.map((r) => r.ladder));
  const past = (key) => rows.filter((r) => r.ladder.steps.find((s) => s.key === key).status === 'done').length;
  const next = rows.find((r) => r.ladder.level <= 4) ?? rows.find((r) => r.ladder.level <= 6);

  const banded = rows.map((r) => ({ ...r, band: band(r.mastery) })).filter((r) => r.band);
  const weakest = [...banded].sort((a, b) => a.mastery.accuracyPct - b.mastery.accuracyPct)[0];
  const repairs = repairTopics(status.mistakes).filter((rp) => rows.some((r) => r.topic === rp.topic));

  return (
    <div className="mt-6 grid gap-4 lg:grid-cols-2">
      <section aria-labelledby="journey-title" className={box}>
        <h2 id="journey-title" className="text-lg font-bold text-slate-900 dark:text-white"><Localized value={JOURNEY_COPY.title} /></h2>
        <ol className="mt-3 flex flex-wrap gap-1.5 text-xs font-semibold">
          {JOURNEY.map((key, i) => (
            <li
              key={key}
              aria-current={key === stage ? 'step' : undefined}
              className={`rounded-full px-2.5 py-1 ring-1 ${key === stage ? 'bg-indigo-600 text-white ring-indigo-600' : i < index ? 'bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30' : 'text-slate-500 ring-slate-200 dark:ring-slate-700'}`}
            >
              <Localized value={JOURNEY_COPY.stages[key]} />
            </li>
          ))}
        </ol>
        <p className="mt-3 text-sm text-slate-700 dark:text-slate-200">
          <Localized value={JOURNEY_COPY.youAreAt} />: <strong><Localized value={JOURNEY_COPY.stages[stage]} /></strong>
        </p>
        <Localized value={JOURNEY_COPY.counts(past('easy'), past('advanced'), rows.length)} as="p" className="mt-1 text-sm text-slate-600 dark:text-slate-300" />
        {next && (
          <Link to={chapterLink(subject, next.topic)} className="mt-3 flex items-center justify-between gap-2 rounded-xl bg-indigo-50 px-3 py-2 text-sm hover:bg-indigo-100 dark:bg-indigo-500/10">
            <span>
              <Localized value={JOURNEY_COPY.nextChapter} className="block text-xs font-bold uppercase tracking-wide text-indigo-700 dark:text-indigo-300" />
              <Localized value={next.title} className="font-semibold text-slate-900 dark:text-white" />
            </span>
            <Localized value={JOURNEY_COPY.atLevel(Math.min(next.ladder.level, 6))} className="shrink-0 text-xs font-bold text-indigo-700 dark:text-indigo-300" />
          </Link>
        )}
        <Localized value={JOURNEY_COPY.rule} as="p" className="mt-3 text-xs text-slate-500 dark:text-slate-400" />
      </section>

      <section aria-labelledby="coach-title" className={box}>
        <h2 id="coach-title" className="text-lg font-bold text-slate-900 dark:text-white"><Localized value={COACH.title} /></h2>
        {!status.signedIn ? (
          <Localized value={COACH.signIn} as="p" className="mt-2 text-sm text-slate-600 dark:text-slate-300" />
        ) : (
          <>
            {weakest && weakest.band !== 'good' && (
              <div className="mt-3 rounded-xl bg-rose-50 p-3 ring-1 ring-rose-200 dark:bg-rose-500/10 dark:ring-rose-500/30">
                <Localized value={COACH.weakest(weakest.title)} as="p" className="font-bold text-rose-900 dark:text-rose-200" />
                <Localized value={COACH.prescription} as="p" className="text-sm text-rose-900 dark:text-rose-200" />
                <div className="mt-2 flex flex-wrap gap-2">
                  <Link to={chapterLink(subject, weakest.topic, 'revision')} className="inline-flex min-h-10 items-center rounded-lg bg-white px-3 text-sm font-semibold text-rose-800 ring-1 ring-rose-300">
                    <Localized value={COACH.revise} />
                  </Link>
                  <Link to={chapterLink(subject, weakest.topic, 'practice')} className="inline-flex min-h-10 items-center rounded-lg bg-rose-600 px-3 text-sm font-semibold text-white">
                    <Localized value={COACH.practise} />
                  </Link>
                </div>
              </div>
            )}
            {repairs.map((rp) => (
              <div key={rp.topic} className="mt-3 rounded-xl bg-amber-50 p-3 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:ring-amber-500/30">
                <Localized value={COACH.repairTitle} as="p" className="text-xs font-bold uppercase tracking-wide text-amber-800 dark:text-amber-300" />
                <Localized value={COACH.repair(rp.name, rp.count)} as="p" className="text-sm text-amber-950 dark:text-amber-100" />
                <Link to={chapterLink(subject, rp.topic, 'practice')} className="mt-1 inline-flex text-sm font-semibold text-amber-900 underline dark:text-amber-200">
                  <Localized value={COACH.practise} /> →
                </Link>
              </div>
            ))}
            {banded.length === 0 ? (
              <Localized value={COACH.notEnough} as="p" className="mt-2 text-sm text-slate-600 dark:text-slate-300" />
            ) : (
              <ul className="mt-3 divide-y divide-slate-100 text-sm dark:divide-slate-800">
                {banded.map((r) => (
                  <li key={r.topic} className="flex items-center justify-between gap-2 py-1.5">
                    <Link to={chapterLink(subject, r.topic)} className="text-slate-800 hover:underline dark:text-slate-200"><Localized value={r.title} /></Link>
                    <span className="tabular-nums font-semibold text-slate-700 dark:text-slate-200">
                      {r.mastery.accuracyPct}% <span aria-hidden="true">{COACH.band[r.band]}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </section>
    </div>
  );
}
