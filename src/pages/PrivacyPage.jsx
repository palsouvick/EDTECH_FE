import { PRIVACY } from '../lib/homeCopy';
import SiteHeader from '../components/navigation/SiteHeader';
import Footer from '../components/navigation/Footer';
import { Localized } from '../components/topic-hub/Localized';

/** /privacy — what we collect and why. */
export default function PrivacyPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-slate-50 dark:bg-slate-950">
      <SiteHeader />
      <main className="mx-auto w-full flex-1 max-w-3xl px-4 py-12">
        <Localized value={PRIVACY.title} as="h1" className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white" />
        <Localized value={PRIVACY.updated} as="p" className="mt-1 text-sm text-slate-500 dark:text-slate-400" />
        <Localized value={PRIVACY.intro} as="p" className="mt-4 text-slate-700 dark:text-slate-300" />
        <Localized value={PRIVACY.note} as="p" className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900 ring-1 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-900" />
        <div className="mt-8 space-y-4">
          {PRIVACY.sections.map((s, i) => (
            <section key={s.id} id={s.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
              <h2 className="font-bold text-slate-900 dark:text-white">
                {i + 1}. <Localized value={s.title} />
              </h2>
              <Localized value={s.body} as="p" className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300" />
            </section>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
