import { useState } from 'react';
import { useDataSource } from '../../app/DataSourceContext';
import { useResource } from '../../hooks/useResource';
import { Localized } from '../topic-hub/Localized';
import { LoadError } from '../../pages/funnel/FunnelLayout';

const t = (en, bn) => ({ en, bn });
const bnDigits = (n) => String(n).replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[d]);

const MONTH_NAMES = [
  t('January', 'জানুয়ারি'), t('February', 'ফেব্রুয়ারি'), t('March', 'মার্চ'), t('April', 'এপ্রিল'),
  t('May', 'মে'), t('June', 'জুন'), t('July', 'জুলাই'), t('August', 'আগস্ট'),
  t('September', 'সেপ্টেম্বর'), t('October', 'অক্টোবর'), t('November', 'নভেম্বর'), t('December', 'ডিসেম্বর'),
];
const dateLabel = (r) => t(`${r.day} ${MONTH_NAMES[r.month - 1].en}`, `${bnDigits(r.day)} ${MONTH_NAMES[r.month - 1].bn}`);

const COPY = Object.freeze({
  title: t('The whole year at a glance', 'এক নজরে সারা বছর'),
  sub: (n) => t(
    `${n} days from January to December in one table. Read a month, then practise it below.`,
    `জানুয়ারি থেকে ডিসেম্বর পর্যন্ত ${bnDigits(n)}টি দিবস এক টেবিলে। একটি মাস পড়ো, তারপর নিচে সেই মাসের অনুশীলন করো।`,
  ),
  all: t('All months', 'সব মাস'),
  date: t('Date', 'তারিখ'),
  day: t('Day and why', 'দিবস ও কারণ'),
  source: t('Source', 'সূত্র'),
  similarTitle: t('Similar names, different dates', 'নাম কাছাকাছি, তারিখ আলাদা'),
  similarSub: t(
    'Exam options are often built from these. Learn each group together.',
    'পরীক্ষার বিকল্পগুলি প্রায়ই এগুলি থেকেই তৈরি হয়। প্রতিটি দল একসঙ্গে মনে রাখো।',
  ),
  confusedTitle: t('Most confused pairs', 'সবচেয়ে বেশি গুলিয়ে যাওয়া জোড়া'),
});

function MonthTable({ m }) {
  const name = MONTH_NAMES[m.month - 1];
  return (
    <section aria-labelledby={`days-m${m.month}`} className="mt-5">
      <h3 id={`days-m${m.month}`} className="text-lg font-bold text-slate-900 dark:text-white"><Localized value={name} /></h3>
      <div className="mt-2 overflow-x-auto rounded-xl ring-1 ring-slate-200 dark:ring-slate-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
            <tr>
              <th scope="col" className="w-28 px-3 py-2"><Localized value={COPY.date} /></th>
              <th scope="col" className="px-3 py-2"><Localized value={COPY.day} /></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {m.rows.map((r) => (
              <tr key={r.day}>
                <td className="whitespace-nowrap px-3 py-2 font-semibold tabular-nums text-slate-900 dark:text-white"><Localized value={dateLabel(r)} /></td>
                <td className="px-3 py-2 text-slate-700 dark:text-slate-300"><Localized value={r.name} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {m.sources.length > 0 && (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          <Localized value={COPY.source} />:{' '}
          {m.sources.map((s, i) => (
            <span key={s.url}>
              {i > 0 && ' · '}
              <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-indigo-600">{s.publisher || s.title}</a>
            </span>
          ))}
        </p>
      )}
    </section>
  );
}

/**
 * Important Days, January to December in one place: a table per month, groups of
 * similar-sounding days on different dates, and the most-confused pairs. All of it comes
 * from the verified month facts (GET /gk/important-days); nothing here is typed in by hand.
 */
export default function YearAtAGlance() {
  const source = useDataSource();
  const res = useResource('gk:important-days', () => source.getImportantDays());
  const [month, setMonth] = useState(0); // 0 = all months

  if (res.status === 'loading') return <div aria-busy="true" className="mt-6 h-40 animate-pulse rounded-2xl bg-slate-200/70 motion-reduce:animate-none dark:bg-slate-800/70" />;
  if (res.status === 'error') return <div className="mt-6"><LoadError error={res.error} onRetry={res.retry} /></div>;
  const { months, dayCount, similarNames, confusedPairs } = res.data;
  if (!months.length) return null;
  const shown = month ? months.filter((m) => m.month === month) : months;

  return (
    <section aria-labelledby="days-year" className="mt-8 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
      <h2 id="days-year" className="text-xl font-bold text-slate-900 dark:text-white"><Localized value={COPY.title} /></h2>
      <Localized value={COPY.sub(dayCount)} as="p" className="mt-1 text-sm text-slate-600 dark:text-slate-300" />

      <div role="group" aria-label="Month" className="mt-4 flex flex-wrap gap-1.5">
        {[0, ...months.map((m) => m.month)].map((n) => (
          <button
            key={n}
            type="button"
            aria-pressed={n === month}
            onClick={() => setMonth(n)}
            className={`min-h-9 rounded-full px-3 text-xs font-semibold ring-1 ${n === month ? 'bg-indigo-600 text-white ring-indigo-600' : 'bg-white text-slate-700 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-700'}`}
          >
            <Localized value={n ? MONTH_NAMES[n - 1] : COPY.all} />
          </button>
        ))}
      </div>

      {shown.map((m) => <MonthTable key={m.month} m={m} />)}

      {confusedPairs.length > 0 && (
        <section aria-labelledby="days-confused" className="mt-8 rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:ring-amber-500/30">
          <h3 id="days-confused" className="font-bold text-amber-900 dark:text-amber-200">⚠ <Localized value={COPY.confusedTitle} /></h3>
          <ul className="mt-2 space-y-1 text-sm text-amber-950 dark:text-amber-100">
            {confusedPairs.map((p) => <li key={p.en}><Localized value={p} /></li>)}
          </ul>
        </section>
      )}

      {similarNames.length > 0 && (
        <section aria-labelledby="days-similar" className="mt-6">
          <h3 id="days-similar" className="font-bold text-slate-900 dark:text-white"><Localized value={COPY.similarTitle} /></h3>
          <Localized value={COPY.similarSub} as="p" className="mt-0.5 text-sm text-slate-600 dark:text-slate-300" />
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {similarNames.map((g) => (
              <li key={g.word} className="rounded-xl p-3 ring-1 ring-slate-200 dark:ring-slate-800">
                <ul className="space-y-1 text-sm">
                  {g.rows.map((r) => (
                    <li key={`${r.month}-${r.day}`} className="flex gap-2">
                      <span className="w-24 shrink-0 font-semibold tabular-nums text-indigo-700 dark:text-indigo-300"><Localized value={dateLabel(r)} /></span>
                      <span className="text-slate-700 dark:text-slate-300"><Localized value={r.name} /></span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </section>
      )}
    </section>
  );
}
