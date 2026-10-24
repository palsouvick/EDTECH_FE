import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useOptionalAuth } from '../../app/AuthContext';
import { useDataSource } from '../../app/DataSourceContext';
import { CHALLENGE } from '../../lib/motivationCopy';
import { playedOnDevice } from '../../pages/ChallengePage';
import { Localized } from '../topic-hub/Localized';
import { ArrowRightIcon } from '../topic-hub/icons';

/** Home-page card: today's 5-question challenge, or today's score once played. */
export default function DailyChallengeCard({ className = '' }) {
  const source = useDataSource();
  const auth = useOptionalAuth();
  const [today, setToday] = useState(null);

  useEffect(() => {
    let alive = true;
    source.getChallenge().then((d) => alive && setToday(d), () => {});
    return () => {
      alive = false;
    };
  }, [source, auth?.user]);

  if (!today?.questions?.length) return null;
  const done = today.done ?? playedOnDevice(today.day);

  return (
    <section aria-label={CHALLENGE.title.en} className={className}>
      <Link
        to="/challenge"
        className="group flex flex-col gap-4 rounded-3xl bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 p-5 text-white shadow-lg shadow-orange-500/20 transition hover:-translate-y-0.5 sm:flex-row sm:items-center sm:p-6 motion-reduce:transition-none"
      >
        <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-white/20 text-3xl" aria-hidden="true">⚡</span>
        <div className="min-w-0 flex-1">
          <Localized value={CHALLENGE.title} as="h2" className="text-xl font-extrabold" />
          <Localized value={done ? CHALLENGE.doneToday(done.correct, done.total) : CHALLENGE.sub} as="p" className="mt-0.5 text-sm text-white/95" />
        </div>
        <span className="inline-flex min-h-11 shrink-0 items-center gap-2 self-start rounded-xl bg-white px-5 font-bold text-orange-700 sm:self-auto">
          <Localized value={done ? { en: 'Play again', bn: 'আবার খেলো' } : CHALLENGE.play} />
          <ArrowRightIcon className="transition-transform group-hover:translate-x-1" />
        </span>
      </Link>
    </section>
  );
}
