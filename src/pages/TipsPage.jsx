import { EXAM_TRICKS, EXAM_TRICKS_PAGE, TIPS, TIPS_PAGE } from '../lib/homeCopy';
import SiteHeader from '../components/navigation/SiteHeader';
import Footer from '../components/navigation/Footer';
import { Localized } from '../components/topic-hub/Localized';

/** /tips — short, practical exam-preparation advice. */
export default function TipsPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-slate-50 dark:bg-slate-950">
      <SiteHeader />
      <main className="mx-auto w-full flex-1 max-w-4xl px-4 py-12">
        <Localized value={TIPS_PAGE.title} as="h1" className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white" />
        <Localized value={TIPS_PAGE.subtitle} as="p" className="mt-2 text-slate-600 dark:text-slate-300" />
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {TIPS.map((x) => (
            <li key={x.icon} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
              <span className="text-2xl" aria-hidden="true">{x.icon}</span>
              <Localized value={x.title} as="h2" className="mt-3 font-bold text-slate-900 dark:text-white" />
              <Localized value={x.body} as="p" className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300" />
            </li>
          ))}
        </ul>

        <section className="mt-14" aria-labelledby="exam-tricks">
          <h2 id="exam-tricks" className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            <Localized value={EXAM_TRICKS_PAGE.title} />
          </h2>
          <Localized value={EXAM_TRICKS_PAGE.subtitle} as="p" className="mt-2 text-slate-600 dark:text-slate-300" />
          <div className="mt-6 space-y-4">
            {EXAM_TRICKS.map((g) => (
              <article key={g.icon} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
                <h3 className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                  <span className="text-2xl" aria-hidden="true">{g.icon}</span>
                  <Localized value={g.title} />
                </h3>
                <ul className="mt-3 space-y-2">
                  {g.items.map((item, i) => (
                    <li key={i} className="flex gap-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                      <span aria-hidden="true" className="mt-0.5 text-indigo-600 dark:text-indigo-400">✓</span>
                      <Localized value={item} />
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
