import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useDataSource } from '../../app/DataSourceContext';
import { useOptionalAuth } from '../../app/AuthContext';
import { languageStore } from '../../hooks/useLanguagePreference';
import { HAS_DEV_USER } from '../../lib/api';
import { CT, withNames } from '../../lib/customTestCopy';
import { MASTERY_QUESTIONS, SECONDS_PER_QUESTION, smartMinutes } from '../../lib/customTest';
import { levelCleared, levelProgress } from '../../lib/learnProgress';
import { QUIZ_LEVELS } from '../../lib/learnCopy';
import { loginPath } from '../auth/AccountButton';
import { Localized } from '../topic-hub/Localized';
import { useStartCustomTest } from './useStartCustomTest';

/**
 * "🏆 Test my mastery" on a chapter page: a 20-question exam-level test from this chapter only.
 * After two or more quiz levels are cleared the card says the chapter is done.
 */
export default function MasteryTestCard({ subject, topic, title }) {
  const source = useDataSource();
  const auth = useOptionalAuth();
  const location = useLocation();
  const start = useStartCustomTest();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  if (typeof source.createCustomTest !== 'function') return null;
  const signedIn = HAS_DEV_USER || Boolean(auth?.user);
  const cleared = QUIZ_LEVELS.filter((l) => levelCleared(levelProgress(subject, topic, l.level).best)).length;
  const minutes = smartMinutes(SECONDS_PER_QUESTION[subject], 'exam', MASTERY_QUESTIONS);

  const go = async () => {
    setBusy(true);
    setError(null);
    try {
      await start({ subject, preset: 'mastery', topics: [topic], questionCount: MASTERY_QUESTIONS, difficulty: 'exam', mode: 'exam', language: languageStore.get() });
    } catch (e) {
      setError(e);
      setBusy(false);
    }
  };

  return (
    <section className="flex flex-col gap-3 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 p-4 ring-1 ring-amber-200 sm:flex-row sm:items-center sm:justify-between dark:from-amber-500/10 dark:to-orange-500/10 dark:ring-amber-500/30">
      <div className="min-w-0">
        <Localized value={CT.masteryTitle} as="h2" className="text-lg font-extrabold text-slate-900 dark:text-white" />
        <Localized value={withNames(cleared >= 2 ? CT.masteryDone : CT.masteryReady, title)} as="p" className="text-sm text-slate-700 dark:text-slate-200" />
        <Localized value={CT.masteryMeta(MASTERY_QUESTIONS, minutes)} as="p" className="mt-0.5 text-xs text-slate-500 dark:text-slate-400" />
        {error && <p role="alert" className="mt-1 text-sm font-semibold text-rose-700 dark:text-rose-300"><Localized value={CT.errors[error.code] ?? CT.errors.generic} /></p>}
      </div>
      {signedIn ? (
        <button type="button" onClick={go} disabled={busy} className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-xl bg-amber-600 px-5 text-sm font-bold text-white hover:bg-amber-500 disabled:opacity-60">
          <Localized value={busy ? CT.starting : CT.masteryBtn} />
        </button>
      ) : (
        <Link to={loginPath(location)} className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-xl bg-amber-600 px-5 text-sm font-bold text-white hover:bg-amber-500">
          <Localized value={CT.signInToUse} />
        </Link>
      )}
    </section>
  );
}
