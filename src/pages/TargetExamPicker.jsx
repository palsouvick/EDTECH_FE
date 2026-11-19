import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../app/AuthContext';
import { useDataSource } from '../app/DataSourceContext';
import { useResource } from '../hooks/useResource';
import { LANGUAGES, useLanguagePreference } from '../hooks/useLanguagePreference';
import { TARGET_EXAM } from '../lib/targetExamCopy';
import { loginPath } from '../components/auth/AccountButton';
import { Localized } from '../components/topic-hub/Localized';
import PageShell from '../components/navigation/PageShell';
import { LoadError } from './funnel/FunnelLayout';

// Daily study time (minutes/day) the profile offers. Same budget set the two
// study plans use (FE pages/IdoPlanPage.jsx, PlanPage.jsx; BE services/targetExam.service.js).
const DAILY_MINUTES = [120, 180, 240, 360];

/** Only same-site paths, so ?next= cannot send students to another site. */
function safeNext(raw) {
  return raw && raw.startsWith('/') && !raw.startsWith('//') ? raw : '/exams';
}

/** An exam/category name: a localized { en, bn, hi } object, or a plain string. */
function Name({ value, className }) {
  if (value && typeof value === 'object') return <Localized value={value} className={className} />;
  return <span className={className}>{value}</span>;
}

const SUPPORT_TONE = {
  full: 'bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30',
  partial: 'bg-sky-50 text-sky-800 ring-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-500/30',
  minimal: 'bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700',
};
const SUPPORT_LABEL = { full: TARGET_EXAM.supportFull, partial: TARGET_EXAM.supportPartial, minimal: TARGET_EXAM.supportMinimal };

/**
 * /choose-exam: pick the one exam the home plan, syllabus and readiness are
 * shaped around. Skipping never blocks entry — the student lands where they
 * were headed, and the home page offers the choice again (once, dismissible).
 * Choosing keeps everything: progress, attempts, mistakes and plans are
 * untouched by a switch, and the picker says so before saving.
 */
export default function TargetExamPicker() {
  const { status, user, setTargetExam } = useAuth();
  const source = useDataSource();
  const location = useLocation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = safeNext(params.get('next'));
  const res = useResource(source.getTargetExamOptions ? 'target-exam:options' : null, () => source.getTargetExamOptions());
  const { lang, setLang } = useLanguagePreference();
  const [selected, setSelected] = useState(null); // exam code, or null until the student picks one
  const [examDate, setExamDate] = useState('');
  // An exam held with no date is "not announced", not a missing value.
  const [notAnnounced, setNotAnnounced] = useState(() => user?.targetExam != null && user.targetExam.date == null);
  // Profile fields (F1): daily study time and study language travel with the
  // student, not with the exam — they survive an exam switch unchanged.
  const [dailyMinutes, setDailyMinutes] = useState(user?.dailyStudyMinutes ?? null);
  const [language, setLanguage] = useState(user?.preferredLanguage ?? lang);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(null); // the option just saved

  if (status === 'ready' && !user) return <Navigate to={loginPath(location)} replace />;

  const options = res.data ?? [];
  const currentCode = user?.targetExam?.code;
  const picked = selected ?? currentCode ?? null;
  const pickedOption = options.find((o) => o.code === picked) ?? null;
  // Pre-fill the date from the exam already held, once the options have loaded.
  const shownDate = examDate || (picked === currentCode ? (user.targetExam.date ?? '').slice(0, 10) : '');

  // Picking an exam: re-picking the exam already held restores its date (or
  // its "not announced" state); a different exam starts with a blank date.
  // Daily time and language are profile-level, so they never reset here.
  const pick = (code) => {
    setSelected(code);
    setExamDate('');
    setNotAnnounced(code === currentCode ? user?.targetExam?.date == null : false);
  };

  const groups = [];
  for (const o of options) {
    const g = groups.find((x) => x.category === o.category);
    if (g) g.options.push(o);
    else groups.push({ category: o.category, categoryName: o.categoryName, options: [o] });
  }

  const save = async (code) => {
    setBusy(true);
    setError(null);
    try {
      const savedUser = await setTargetExam({
        examCode: code,
        examDate: notAnnounced ? null : (shownDate || null),
        dailyStudyMinutes: dailyMinutes,
        preferredLanguage: language,
      });
      // Apply the study language on this device once the server has it.
      if (savedUser?.preferredLanguage) setLang(savedUser.preferredLanguage);
      setSaved(options.find((o) => o.code === code) ?? { code });
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageShell className="max-w-3xl pb-16 pt-6 sm:pt-10">
      <header>
        <Localized value={TARGET_EXAM.pickerTitle} as="h1" className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white" />
        <Localized value={TARGET_EXAM.pickerSub} as="p" className="mt-2 text-slate-600 dark:text-slate-300" />
      </header>

      {saved ? (
        <div className="mt-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
          <Localized value={TARGET_EXAM.saved} as="p" className="text-lg font-bold text-slate-900 dark:text-white" />
          <p className="mt-1 text-slate-600 dark:text-slate-300">
            <Name value={saved.name} className="font-semibold text-slate-900 dark:text-white" />
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link to="/my-syllabus" className="inline-flex min-h-11 items-center rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white hover:bg-indigo-500">
              <Localized value={TARGET_EXAM.viewSyllabus} />
            </Link>
            <Link to={next} className="inline-flex min-h-11 items-center rounded-xl px-5 text-sm font-semibold text-indigo-700 ring-1 ring-indigo-200 hover:bg-indigo-50 dark:text-indigo-300 dark:ring-indigo-500/40">
              <Localized value={TARGET_EXAM.continue} /> →
            </Link>
          </div>
        </div>
      ) : res.status === 'error' ? (
        <div className="mt-6"><LoadError error={res.error} onRetry={res.retry} /></div>
      ) : res.status === 'loading' ? (
        <div className="mt-6 space-y-3" aria-busy="true">
          {[0, 1, 2].map((i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-100 motion-reduce:animate-none dark:bg-slate-800" />)}
        </div>
      ) : (
        <>
          <div className="mt-6 space-y-8">
            {groups.map((g) => (
              <section key={g.category} aria-labelledby={`cat-${g.category}`}>
                <h2 id={`cat-${g.category}`} className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  <Name value={g.categoryName ?? g.category} />
                </h2>
                <ul className="mt-3 space-y-3">
                  {g.options.map((o) => {
                    const active = picked === o.code;
                    return (
                      <li key={o.code}>
                        <button
                          type="button"
                          aria-pressed={active}
                          onClick={() => pick(o.code)}
                          className={`flex w-full items-start gap-3 rounded-2xl bg-white p-4 text-left shadow-sm ring-1 hover:ring-indigo-300 dark:bg-slate-900 ${active ? 'ring-2 ring-indigo-600 dark:ring-indigo-400' : 'ring-slate-200 dark:ring-slate-800'}`}
                        >
                          <span className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full ring-2 ${active ? 'bg-indigo-600 text-white ring-indigo-600' : 'ring-slate-300 dark:ring-slate-600'}`} aria-hidden="true">
                            {active && '✓'}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block font-bold text-slate-900 dark:text-white">
                              <Name value={o.name} />
                              {o.fullName && <span className="ml-2 font-normal text-slate-500 dark:text-slate-400"><Name value={o.fullName} /></span>}
                            </span>
                            <span className={`mt-1.5 inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${SUPPORT_TONE[o.support] ?? SUPPORT_TONE.minimal}`}>
                              <Localized value={SUPPORT_LABEL[o.support] ?? SUPPORT_LABEL.minimal} />
                            </span>
                            {o.support === 'partial' && o.pyqCount != null && (
                              <span className="ml-2 text-xs tabular-nums text-slate-500 dark:text-slate-400">
                                <Localized value={TARGET_EXAM.pyqCount(o.pyqCount)} />
                              </span>
                            )}
                            {o.hasPattern && o.patternAsOf && (
                              <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">{o.patternAsOf}</span>
                            )}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>

          {pickedOption && (
            <>
              <div className="mt-6 rounded-2xl bg-white p-5 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                  <Localized value={TARGET_EXAM.examDate} />
                  <input
                    type="date"
                    value={shownDate}
                    disabled={notAnnounced}
                    onChange={(e) => { setExamDate(e.target.value); setNotAnnounced(false); }}
                    className="mt-1 block min-h-11 w-full rounded-xl px-3 ring-1 ring-slate-300 disabled:opacity-50 dark:bg-slate-950 dark:ring-slate-700"
                  />
                </label>
                <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                  <input
                    type="checkbox"
                    checked={notAnnounced}
                    onChange={(e) => { setNotAnnounced(e.target.checked); if (e.target.checked) setExamDate(''); }}
                    className="size-4 accent-indigo-600"
                  />
                  <Localized value={TARGET_EXAM.dateNotAnnounced} />
                </label>
                <Localized value={TARGET_EXAM.examDateHint} as="p" className="mt-1 text-xs text-slate-500 dark:text-slate-400" />
              </div>

              <div className="mt-6 rounded-2xl bg-white p-5 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  <Localized value={TARGET_EXAM.dailyStudy} />
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="Daily study time">
                  {DAILY_MINUTES.map((m) => (
                    <button
                      key={m}
                      type="button"
                      aria-pressed={dailyMinutes === m}
                      onClick={() => setDailyMinutes(dailyMinutes === m ? null : m)}
                      className={`min-h-10 rounded-full px-4 text-sm font-bold ${dailyMinutes === m ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200'}`}
                    >
                      {m / 60}h
                    </button>
                  ))}
                </div>
                <Localized value={TARGET_EXAM.dailyStudyHint} as="p" className="mt-1 text-xs text-slate-500 dark:text-slate-400" />
              </div>

              <div className="mt-6 rounded-2xl bg-white p-5 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  <Localized value={TARGET_EXAM.studyLanguage} />
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="Study language">
                  {LANGUAGES.map((l) => (
                    <button
                      key={l.code}
                      type="button"
                      aria-pressed={language === l.code}
                      onClick={() => setLanguage(l.code)}
                      className={`min-h-10 rounded-full px-4 text-sm font-bold ${language === l.code ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200'}`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
                <Localized value={TARGET_EXAM.studyLanguageHint} as="p" className="mt-1 text-xs text-slate-500 dark:text-slate-400" />
              </div>
            </>
          )}

          <Localized value={TARGET_EXAM.keptNote} as="p" className="mt-6 text-sm text-slate-600 dark:text-slate-300" />

          {error && (
            <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950/50 dark:text-red-200">
              {error.message}
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={!picked || busy}
              onClick={() => save(picked)}
              className="inline-flex min-h-12 items-center rounded-xl bg-indigo-600 px-6 text-base font-bold text-white hover:bg-indigo-500 disabled:opacity-60"
            >
              <Localized value={busy ? TARGET_EXAM.saving : TARGET_EXAM.save} />
            </button>
            <button
              type="button"
              onClick={() => navigate(next, { replace: true })}
              className="inline-flex min-h-12 items-center rounded-xl px-5 text-sm font-semibold text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50 dark:text-slate-200 dark:ring-slate-700 dark:hover:bg-slate-800"
            >
              <Localized value={TARGET_EXAM.skip} />
            </button>
          </div>
        </>
      )}
    </PageShell>
  );
}
