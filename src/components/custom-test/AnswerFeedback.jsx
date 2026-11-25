import { CT, withNames } from '../../lib/customTestCopy';
import LearnThisLink from '../review/LearnThisLink';
import { Localized } from '../topic-hub/Localized';
import { reviseLink } from './CustomTestResult';

/**
 * Right / wrong, the correct option, the trap note for the chosen option, the explanation,
 * the shortcut and where to learn it, for one checked question of a custom test
 * (POST /custom-tests/:id/check). Used by practice mode and by "Check answer" on the exam screen.
 *
 * @param {object} props
 * @param {object} props.fb       the check response
 * @param {object} props.q        the live question (options with optionId)
 * @param {string} props.subject  subject code, for the revise link
 */
export default function AnswerFeedback({ fb, q, subject }) {
  const letter = (id) => 'ABCD'[q.options.findIndex((o) => o.optionId === id)];
  const trap = fb.explanation.traps.find((t) => t.optionId && t.optionId === fb.selectedOptionId);
  return (
    <div role="status" className={`space-y-3 rounded-2xl p-4 ring-1 ${fb.isCorrect ? 'bg-emerald-50 ring-emerald-200 dark:bg-emerald-500/10 dark:ring-emerald-500/30' : 'bg-rose-50 ring-rose-200 dark:bg-rose-500/10 dark:ring-rose-500/30'}`}>
      <Localized value={fb.isCorrect ? CT.correct : CT.wrong} as="p" className="text-lg font-extrabold text-slate-900 dark:text-white" />
      {!fb.isCorrect && (
        <p className="text-sm">
          <Localized value={CT.correctIs} className="font-semibold" />: <b>{letter(fb.correctOptionId)}</b>{' '}
          <Localized value={q.options.find((o) => o.optionId === fb.correctOptionId)?.text} markdown inline />
        </p>
      )}
      {trap?.note && <p className="text-sm text-rose-900 dark:text-rose-100"><Localized value={CT.trap} className="font-semibold" />: <Localized value={trap.note} markdown inline /></p>}
      <div className="text-sm">
        <Localized value={CT.explanation} as="p" className="font-bold text-slate-900 dark:text-white" />
        {fb.explanation.steps.length
          ? fb.explanation.steps.map((st, i) => <Localized key={i} value={st} markdown as="div" className="mt-1 text-slate-800 dark:text-slate-100" />)
          : <Localized value={CT.noExplanation} as="p" className="text-slate-500" />}
      </div>
      {fb.explanation.shortcut && (
        <div className="text-sm">
          <Localized value={CT.shortcut} as="p" className="font-bold text-amber-800 dark:text-amber-200" />
          <Localized value={fb.explanation.shortcut} markdown as="div" className="text-slate-800 dark:text-slate-100" />
        </div>
      )}
      {/* The exact place to learn it (new tab, so the test stays where it is); the chapter otherwise. */}
      {fb.learn ? (
        <LearnThisLink learn={fb.learn} newTab />
      ) : (
        <p className="text-sm">
          <Localized value={CT.relatedConcept} className="font-bold" />: <Localized value={fb.concept.name} />
          {fb.concept.pattern && <> · <Localized value={fb.concept.pattern} /></>}
          {' · '}
          {/* A new tab, so the test stays where it is (it can also be resumed later). */}
          <a href={reviseLink(subject, fb.concept.topic)} target="_blank" rel="noopener" className="font-semibold text-indigo-700 underline dark:text-indigo-300">
            <Localized value={withNames(CT.reviseBtn, fb.concept.name)} /> ↗
          </a>
        </p>
      )}
    </div>
  );
}
