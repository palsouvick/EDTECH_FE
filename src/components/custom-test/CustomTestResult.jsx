import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDataSource } from '../../app/DataSourceContext';
import { CT, withNames } from '../../lib/customTestCopy';
import { languageStore } from '../../hooks/useLanguagePreference';
import { learnPaths } from '../../lib/routes';
import PageShell from '../navigation/PageShell';
import { Localized } from '../topic-hub/Localized';
import { LoadError } from '../../pages/funnel/FunnelLayout';
import CustomTestDialog from './CustomTestDialog';
import { NextSmartQuizAfterTest } from '../analysis/AnalysisParts';
import { useStartCustomTest } from './useStartCustomTest';

const card = 'rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5 dark:bg-slate-900 dark:ring-slate-800';
const btn = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500';
const BAND_TONE = {
  strong: 'bg-emerald-50 text-emerald-900 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-100 dark:ring-emerald-500/30',
  practice: 'bg-amber-50 text-amber-900 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-100 dark:ring-amber-500/30',
  weak: 'bg-rose-50 text-rose-900 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-100 dark:ring-rose-500/30',
};
const CONCEPT_TONE = { strong: 'text-emerald-700 dark:text-emerald-300', weak: 'text-rose-700 dark:text-rose-300', revise: 'text-amber-700 dark:text-amber-300' };

const mmss = (sec) => `${Math.floor(sec / 60)} min ${String(Math.round(sec % 60)).padStart(2, '0')} sec`;

/** Where "Revise <chapter>" goes: the chapter's lesson (GK chapters live on the GK dashboard). */
export const reviseLink = (subject, topic) => (subject === 'gs' ? learnPaths.subject('gs') : learnPaths.chapter(subject, topic));

function ReviewItem({ item, subject, name }) {
  const optionText = (id) => item.options?.find((o) => o.optionId === id)?.text;
  const trap = item.explanation?.traps?.find((tr) => tr.optionId && tr.optionId === item.selectedOptionId);
  const steps = item.explanation?.steps ?? [];
  return (
    <li className="rounded-xl p-4 ring-1 ring-slate-200 dark:ring-slate-800">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Localized value={CT.qN(item.seq)} as="h3" className="font-bold text-slate-900 dark:text-white" />
        <Localized value={CT.outcomes[item.outcome] ?? CT.outcomes.UNATTEMPTED} className="text-sm font-bold" />
      </div>
      {item.unavailable ? null : (
        <>
          <Localized value={item.stem} markdown as="div" className="mt-2 text-slate-900 dark:text-white" />
          <ol className="mt-2 space-y-1 text-sm">
            {item.options.map((o, k) => {
              const right = o.optionId === item.correctOptionId;
              const mine = o.optionId === item.selectedOptionId;
              return (
                <li key={o.optionId} className={`flex gap-2 rounded-lg px-2 py-1 ${right ? 'bg-emerald-50 font-semibold dark:bg-emerald-500/10' : mine ? 'bg-rose-50 dark:bg-rose-500/10' : ''}`}>
                  <span className="font-bold">{'ABCD'[k]}.</span>
                  <Localized value={o.text} markdown inline />
                  {right && <span aria-hidden="true">✅</span>}
                  {mine && !right && <span aria-hidden="true">❌</span>}
                </li>
              );
            })}
          </ol>
          <p className="mt-2 text-sm">
            <Localized value={CT.yourAnswer} className="font-semibold" />:{' '}
            {item.selectedOptionId ? <><b>{'ABCD'[item.options.findIndex((o) => o.optionId === item.selectedOptionId)]}</b> <Localized value={optionText(item.selectedOptionId)} markdown inline /></> : <Localized value={CT.notAnswered} />}
            {' · '}
            <Localized value={CT.correctIs} className="font-semibold" />: <b>{'ABCD'[item.options.findIndex((o) => o.optionId === item.correctOptionId)]}</b>
          </p>
          <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-800/60">
            <Localized value={CT.why} as="p" className="font-bold text-slate-900 dark:text-white" />
            {steps.length ? steps.map((st, i) => <Localized key={i} value={st} markdown as="div" className="mt-1 text-slate-700 dark:text-slate-200" />) : <Localized value={CT.noExplanation} as="p" className="mt-1 text-slate-500" />}
            {trap?.note && (
              <p className="mt-2 text-rose-800 dark:text-rose-200"><Localized value={CT.trap} className="font-semibold" />: <Localized value={trap.note} markdown inline /></p>
            )}
            {item.explanation?.shortcut && (
              <div className="mt-2">
                <Localized value={CT.shortcut} as="p" className="font-bold text-amber-800 dark:text-amber-200" />
                <Localized value={item.explanation.shortcut} markdown as="div" className="text-slate-700 dark:text-slate-200" />
              </div>
            )}
          </div>
          {item.outcome !== 'CORRECT' && (
            <Link to={reviseLink(subject, item.topic)} className={`${btn} mt-3 bg-indigo-50 text-indigo-800 ring-1 ring-indigo-200 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-200 dark:ring-indigo-500/30`}>
              📖 <Localized value={withNames(CT.reviseBtn, name ?? { en: item.topic })} />
            </Link>
          )}
        </>
      )}
    </li>
  );
}

/**
 * Result of a custom chapter test: score, accuracy, time, chapter table (strong / needs practice /
 * weak), concepts, what to do next, practice again / challenge me, and every question with its
 * answer, explanation, shortcut and a "Revise <chapter>" link.
 */
export default function CustomTestResult({ sessionId }) {
  const source = useDataSource();
  const start = useStartCustomTest();
  const [state, setState] = useState({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const [onlyMistakes, setOnlyMistakes] = useState(true);
  const [busy, setBusy] = useState(null);
  const [startError, setStartError] = useState(null);
  const [dialog, setDialog] = useState(false);

  useEffect(() => {
    let live = true;
    setState({ status: 'loading' });
    Promise.all([source.getCustomTestReport(sessionId), source.getMockAnalytics(sessionId)]).then(
      ([report, analytics]) => live && setState({ status: 'ready', report, review: analytics.review }),
      (error) => live && setState({ status: 'error', error }),
    );
    return () => {
      live = false;
    };
  }, [source, sessionId, attempt]);

  const names = useMemo(() => new Map((state.report?.chapters ?? []).map((c) => [c.topic, c.name])), [state.report]);

  if (state.status === 'loading') {
    return (
      <PageShell className="max-w-4xl py-8">
        <div aria-busy="true" className="h-72 animate-pulse rounded-2xl bg-slate-200/70 motion-reduce:animate-none dark:bg-slate-800/70" />
      </PageShell>
    );
  }
  if (state.status === 'error') return <PageShell className="max-w-4xl py-8"><LoadError error={state.error} onRetry={() => setAttempt((n) => n + 1)} /></PageShell>;

  const r = state.report;
  const subject = r.subject;
  const run = async (key, body) => {
    setBusy(key);
    setStartError(null);
    try {
      await start({ language: languageStore.get(), ...body });
    } catch (e) {
      setStartError(e);
      setBusy(null);
    }
  };
  const groups = ['strong', 'practice', 'weak'].map((band) => ({ band, chapters: r.chapters.filter((c) => c.band === band) })).filter((g) => g.chapters.length);
  const shown = state.review.filter((x) => !onlyMistakes || x.outcome !== 'CORRECT');
  const focusNames = r.nextTest.focusTopics.map((f) => f.name);

  return (
    <PageShell className="max-w-4xl space-y-5 pb-16 pt-6 sm:pt-8">
      <section className={`${card} bg-gradient-to-br from-indigo-600 to-violet-600 text-white ring-0`}>
        <Localized value={CT.resultTitle} as="h1" className="text-2xl font-extrabold sm:text-3xl" />
        <p className="mt-1 text-sm text-indigo-100">
          <Localized value={CT.presetNames[r.custom.preset] ?? CT.presetNames.custom} /> · <Localized value={CT.subjects[subject]} />
        </p>
        <dl className="mt-4 grid grid-cols-3 gap-3">
          <div>
            <Localized value={CT.score} as="dt" className="text-xs font-semibold uppercase tracking-wide text-indigo-100" />
            <dd className="text-2xl font-extrabold tabular-nums sm:text-3xl">{r.correct}/{r.total}</dd>
          </div>
          <div>
            <Localized value={CT.accuracyLabel} as="dt" className="text-xs font-semibold uppercase tracking-wide text-indigo-100" />
            <dd className="text-2xl font-extrabold tabular-nums sm:text-3xl">{r.accuracy}%</dd>
          </div>
          <div>
            <Localized value={CT.timeTaken} as="dt" className="text-xs font-semibold uppercase tracking-wide text-indigo-100" />
            <dd className="text-lg font-bold tabular-nums sm:text-2xl">{mmss(r.timeSec || 0)}</dd>
          </div>
        </dl>
        {r.marking.basis === 'OFFICIAL' && r.marking.negative > 0 && (
          <p className="mt-3 text-xs text-indigo-100">
            {r.score}/{r.maxScore} · <Localized value={CT.marksNote(r.marking.positive, r.marking.negative)} />
          </p>
        )}
        {r.masteryPct != null && r.chapters[0] && <Localized value={withNames((n) => CT.mastery(n, r.masteryPct), r.chapters[0].name)} as="p" className="mt-3 text-lg font-extrabold" />}
        {r.previous && <Localized value={CT.previous(r.previous.accuracy, r.accuracy)} as="p" className="mt-2 text-sm font-semibold" />}
      </section>

      <section className={card}>
        <Localized value={CT.chapterPerformance} as="h2" className="text-base font-extrabold text-slate-900 dark:text-white" />
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[20rem] text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="py-1.5 pr-3 font-semibold"><Localized value={CT.chapter} /></th>
                <th className="py-1.5 pr-3 text-right font-semibold"><Localized value={CT.correctCol} /></th>
                <th className="py-1.5 text-right font-semibold"><Localized value={CT.accuracyLabel} /></th>
              </tr>
            </thead>
            <tbody>
              {r.chapters.map((c) => (
                <tr key={c.topic} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="py-2 pr-3 font-medium"><Localized value={c.name} /></td>
                  <td className="py-2 pr-3 text-right tabular-nums">{c.correct}/{c.total}</td>
                  <td className="py-2 text-right font-bold tabular-nums">{c.accuracy}% {{ strong: '🟢', practice: '🟡', weak: '🔴' }[c.band]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {groups.map((g) => (
            <div key={g.band} className={`rounded-xl p-3 ring-1 ${BAND_TONE[g.band]}`}>
              <Localized value={CT.bands[g.band]} as="p" className="text-sm font-bold" />
              <p className="mt-0.5 text-sm">{g.chapters.map((c, i) => <span key={c.topic}>{i > 0 && ', '}<Localized value={c.name} /></span>)}</p>
            </div>
          ))}
        </div>
      </section>

      {r.concepts.length > 0 && (
        <section className={card}>
          <Localized value={CT.concepts} as="h2" className="text-base font-extrabold text-slate-900 dark:text-white" />
          <ul className="mt-2 grid gap-1.5 text-sm sm:grid-cols-2">
            {r.concepts.map((c) => (
              <li key={`${c.topic}.${c.pattern}`} className="flex items-baseline justify-between gap-2">
                <Localized value={c.name} className="min-w-0 truncate" />
                <span className={`shrink-0 font-semibold ${CONCEPT_TONE[c.status]}`}><Localized value={CT.conceptStatus[c.status]} /> · <span className="tabular-nums">{c.correct}/{c.total}</span></span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className={card}>
        <Localized value={CT.nextSteps} as="h2" className="text-base font-extrabold text-slate-900 dark:text-white" />
        <ul className="mt-3 space-y-3">
          {r.recommendations.map((x) => (
            <li key={x.topic} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
              <Localized
                value={x.action === 'next_chapter' ? withNames(CT.rec.next_chapter, x.name, x.nextName ?? { en: x.nextTopic }) : withNames(CT.rec[x.action], x.name)}
                as="p"
                className="text-sm font-semibold text-slate-900 dark:text-white"
              />
              <div className="mt-2 flex flex-wrap gap-2">
                {x.action === 'next_chapter' && x.nextTopic && (
                  <Link to={reviseLink(subject, x.nextTopic)} className={`${btn} bg-emerald-600 text-white hover:bg-emerald-500`}><Localized value={withNames(CT.openChapter, x.nextName ?? { en: x.nextTopic })} /> →</Link>
                )}
                {x.action === 'revise' && (
                  <>
                    <Link to={reviseLink(subject, x.topic)} className={`${btn} bg-indigo-600 text-white hover:bg-indigo-500`}>📖 <Localized value={withNames(CT.reviseBtn, x.name)} /></Link>
                    {subject !== 'gs' && <Link to={learnPaths.quiz(subject, x.topic, 'beginner')} className={`${btn} ring-1 ring-slate-300 dark:ring-slate-700`}><Localized value={CT.basicQuiz} /></Link>}
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
          <button type="button" disabled={Boolean(busy)} onClick={() => run('again', { subject, preset: 'followup', followUpOf: r.sessionId })} className={`${btn} bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-60`}>
            <Localized value={busy === 'again' ? CT.starting : CT.practiceAgain} />
          </button>
          {r.challenge.unlocked && (
            <button type="button" disabled={Boolean(busy)} onClick={() => run('challenge', { subject, preset: 'challenge', topics: r.custom.topics, mode: r.custom.mode })} className={`${btn} bg-fuchsia-600 text-white hover:bg-fuchsia-500 disabled:opacity-60`}>
              <Localized value={busy === 'challenge' ? CT.starting : CT.challengePreset} />
            </button>
          )}
          <button type="button" onClick={() => setDialog(true)} className={`${btn} ring-1 ring-slate-300 dark:ring-slate-700`}><Localized value={CT.newTest} /></button>
          <Link to="/mistakes" className={`${btn} ring-1 ring-slate-300 dark:ring-slate-700`}><Localized value={CT.mistakeNotebook} /></Link>
          <Link to={learnPaths.subject(subject)} className={`${btn} ring-1 ring-slate-300 dark:ring-slate-700`}><Localized value={CT.backToLearn} /></Link>
        </div>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          {r.nextTest.harder ? <Localized value={CT.practiceAgainHarder} /> : focusNames.length > 0 && <Localized value={{ en: CT.practiceAgainHint(focusNames.map((n) => n.en).join(', ')).en, bn: CT.practiceAgainHint(focusNames.map((n) => n.bn ?? n.en).join(', ')).bn }} />}
          {r.challenge.unlocked && <> · <Localized value={CT.challengeHint} /></>}
        </p>
        {startError && <p role="alert" className="mt-2 text-sm font-semibold text-rose-700 dark:text-rose-300"><Localized value={CT.errors[startError.code] ?? CT.errors.generic} /></p>}
        {r.wrong > 0 && <Localized value={CT.savedToNotebook} as="p" className="mt-2 text-xs text-slate-500 dark:text-slate-400" />}
      </section>

      <section className={card}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Localized value={CT.questionAnalysis} as="h2" className="text-base font-extrabold text-slate-900 dark:text-white" />
          <button type="button" onClick={() => setOnlyMistakes((v) => !v)} className={`${btn} min-h-9 ring-1 ring-slate-300 dark:ring-slate-700`}>
            <Localized value={onlyMistakes ? CT.showAll : CT.showMistakes} />
          </button>
        </div>
        <ol className="mt-3 space-y-3">
          {shown.map((item) => <ReviewItem key={item.questionId} item={item} subject={subject} name={names.get(item.topic)} />)}
        </ol>
      </section>

      {dialog && <CustomTestDialog open onClose={() => setDialog(false)} subject={subject} initial={{ topics: r.custom.topics, mode: r.custom.mode }} />}
      <div className="mt-6"><NextSmartQuizAfterTest subject={subject} /></div>
    </PageShell>
  );
}
