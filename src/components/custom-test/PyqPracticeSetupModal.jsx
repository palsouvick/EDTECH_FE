import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useDataSource } from '../../app/DataSourceContext';
import { useLanguagePreference } from '../../hooks/useLanguagePreference';
import { PYQ } from '../../lib/pyqCopy';
import { CT } from '../../lib/customTestCopy';
import { PYQ_COUNT_CHOICES, PYQ_TIME_CHOICES, PYQ_REPEAT_MODES, buildPyqRequest, examOptions, minMinutes, parseMinutes, yearsFor } from '../../lib/pyqPractice';
import { parseCount } from '../../lib/customTest';
import { Localized } from '../topic-hub/Localized';
import { loginPath } from '../auth/AccountButton';
import { useStartCustomTest } from './useStartCustomTest';

const chip = 'inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-3 text-sm font-semibold ring-1 transition-colors focus-visible:outline-2 focus-visible:outline-indigo-500';
const on = 'bg-indigo-600 text-white ring-indigo-600';
const off = 'bg-white text-slate-700 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-700 dark:hover:bg-slate-800';

function Section({ title, children }) {
  return (
    <section className="space-y-2">
      <Localized value={title} as="h3" className="text-sm font-bold text-slate-900 dark:text-white" />
      {children}
    </section>
  );
}

function Choice({ selected, onClick, disabled, children, ...rest }) {
  return (
    <button type="button" role="radio" aria-checked={selected} disabled={disabled} onClick={onClick} className={`${chip} ${selected ? on : off} disabled:opacity-50`} {...rest}>
      {children}
    </button>
  );
}

/**
 * Subject-wise PYQ practice setup: exam, questions, time, difficulty, year and which
 * PYQs — with the live count of matching real past-paper questions before starting.
 * Never pads with generated questions: when fewer match than requested, the test
 * starts with what matched (at least 5). Marking is practice marking throughout.
 * @param {{ open: boolean, onClose: () => void, subject: 'quant'|'english'|'gs', filters: object }} props
 */
export default function PyqPracticeSetupModal({ open, onClose, subject, filters }) {
  const source = useDataSource();
  const { lang } = useLanguagePreference();
  const location = useLocation();
  const start = useStartCustomTest();
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal?.();
    if (!open && el.open) el.close?.();
  }, [open]);
  const [exam, setExam] = useState('');
  const [count, setCount] = useState(10);
  const [customCount, setCustomCount] = useState(false);
  const [countText, setCountText] = useState('');
  const [time, setTime] = useState(10);
  const [customTime, setCustomTime] = useState(false);
  const [timeText, setTimeText] = useState('');
  const [difficulty, setDifficulty] = useState('mixed');
  const [yearMode, setYearMode] = useState('all');
  const [year, setYear] = useState(null);
  const [yearFrom, setYearFrom] = useState('');
  const [yearTo, setYearTo] = useState('');
  const [repeat, setRepeat] = useState('all');
  const [preview, setPreview] = useState(null);
  const [previewError, setPreviewError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const exams = useMemo(() => examOptions(filters), [filters]);
  const years = useMemo(() => yearsFor(filters, exam || null), [filters, exam]);
  const countValid = !customCount || parseCount(countText) != null;
  const customMinutes = customTime ? parseMinutes(timeText, count) : null;
  const timeValid = !customTime || customMinutes != null;
  const rangeValid = yearMode !== 'range' || ((yearFrom === '' || /^\d{4}$/.test(yearFrom)) && (yearTo === '' || /^\d{4}$/.test(yearTo)) && (yearFrom === '' || yearTo === '' || Number(yearFrom) <= Number(yearTo)));
  const body = useMemo(() => {
    if (!countValid || !timeValid || !rangeValid) return null;
    return buildPyqRequest(subject, {
      exam,
      count,
      difficulty,
      repeat,
      yearMode,
      year,
      yearFrom: yearFrom === '' ? null : Number(yearFrom),
      yearTo: yearTo === '' ? null : Number(yearTo),
      time: customTime ? 'custom' : time,
      customMinutes,
    }, lang);
  }, [subject, exam, count, countValid, difficulty, repeat, yearMode, year, yearFrom, yearTo, time, customTime, customMinutes, timeValid, rangeValid, lang]);

  const bodyKey = body ? JSON.stringify(body) : null;
  useEffect(() => {
    if (!open || !bodyKey) {
      setPreview(null);
      return undefined;
    }
    let live = true;
    setPreview(null);
    setPreviewError(null);
    const id = setTimeout(() => {
      if (typeof source.previewCustomTest !== 'function') {
        live && setPreviewError({ code: 'OFFLINE' });
        return;
      }
      source.previewCustomTest(JSON.parse(bodyKey)).then(
        (p) => live && (setPreview(p), setError(null)),
        (err) => live && setPreviewError(err),
      );
    }, 250);
    return () => {
      live = false;
      clearTimeout(id);
    };
  }, [open, bodyKey, source]);

  const available = preview?.pyq?.available ?? null;
  const shortBy = preview?.shortBy ?? 0;
  const canStart = Boolean(body) && available != null && available >= 5 && !busy && !previewError;
  const startLabel = available != null && shortBy > 0 ? PYQ.startWith(available) : PYQ.startTest;

  const begin = async () => {
    if (!body || !canStart) return;
    setBusy(true);
    setError(null);
    try {
      await start(body);
      onClose();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  const errorText = error && (CT.errors[error.code] ?? (error.message ? { en: error.message } : CT.errors.generic));
  const needsSignIn = previewError?.code === 'UNAUTHENTICATED' || error?.code === 'UNAUTHENTICATED';

  return (
    <dialog
      ref={ref}
      aria-labelledby="pyq-setup-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="m-auto max-h-[94dvh] w-[min(46rem,calc(100vw-1rem))] overflow-hidden rounded-2xl bg-slate-50 p-0 text-slate-800 shadow-2xl backdrop:bg-slate-950/50 backdrop:backdrop-blur-sm dark:bg-slate-950 dark:text-slate-100"
    >
      {open && (
        <div className="flex max-h-[94dvh] flex-col">
          <header className="border-b border-slate-200 bg-white px-4 py-3 sm:px-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 id="pyq-setup-title" className="text-lg font-extrabold text-slate-900 dark:text-white"><Localized value={PYQ.setupTitle} /></h2>
                <p className="mt-0.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                  <Localized value={PYQ.subjectNames[subject]} /> · <Localized value={PYQ.markingNote} />
                </p>
              </div>
              <button type="button" onClick={onClose} className="grid size-11 shrink-0 place-items-center rounded-xl text-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label={CT.close[lang] ?? CT.close.en}>
                ✕
              </button>
            </div>
          </header>

          <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4 sm:px-6">
            <Section title={PYQ.examLabel}>
              <div role="radiogroup" aria-label={PYQ.examLabel.en} className="flex flex-wrap gap-2">
                <Choice selected={exam === ''} onClick={() => { setExam(''); setYearMode('all'); setYear(null); }}>
                  <Localized value={PYQ.examAll} />
                </Choice>
                {exams.map((e) => (
                  <Choice key={e.name} selected={exam === e.name} onClick={() => { setExam(e.name); setYearMode('all'); setYear(null); }}>
                    {e.name}
                  </Choice>
                ))}
              </div>
            </Section>

            <Section title={PYQ.countLabel}>
              <div role="radiogroup" aria-label={PYQ.countLabel.en} className="flex flex-wrap gap-2">
                {PYQ_COUNT_CHOICES.map((n) => (
                  <Choice key={n} selected={!customCount && count === n} onClick={() => { setCount(n); setCustomCount(false); }}>
                    {n}
                  </Choice>
                ))}
                <Choice selected={customCount} onClick={() => setCustomCount(true)}>
                  <Localized value={CT.custom} />
                </Choice>
              </div>
              {customCount && (
                <label className="block max-w-xs">
                  <Localized value={PYQ.customCountLabel} as="span" className="text-xs font-semibold text-slate-600 dark:text-slate-300" />
                  <input
                    type="number"
                    inputMode="numeric"
                    min={5}
                    max={100}
                    value={countText}
                    onChange={(e) => {
                      const n = parseCount(e.target.value);
                      setCountText(e.target.value);
                      if (n != null) setCount(n);
                    }}
                    aria-invalid={countText !== '' && parseCount(countText) == null}
                    className="mt-1 min-h-11 w-full rounded-xl border-0 bg-white px-3 text-base ring-1 ring-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-900 dark:ring-slate-700"
                  />
                </label>
              )}
            </Section>

            <Section title={PYQ.timeLabel}>
              <div role="radiogroup" aria-label={PYQ.timeLabel.en} className="flex flex-wrap gap-2">
                {PYQ_TIME_CHOICES.map((m) => (
                  <Choice key={m} selected={!customTime && time === m} disabled={m < minMinutes(count)} onClick={() => { setTime(m); setCustomTime(false); }}>
                    <span aria-hidden="true">⏱</span> <Localized value={CT.minutes(m)} />
                  </Choice>
                ))}
                <Choice selected={customTime} onClick={() => setCustomTime(true)}>
                  <Localized value={CT.custom} />
                </Choice>
              </div>
              {customTime && (
                <label className="block max-w-xs">
                  <Localized value={PYQ.customTimeLabel} as="span" className="text-xs font-semibold text-slate-600 dark:text-slate-300" />
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={300}
                    value={timeText}
                    onChange={(e) => setTimeText(e.target.value)}
                    aria-invalid={timeText !== '' && parseMinutes(timeText, count) == null}
                    className="mt-1 min-h-11 w-full rounded-xl border-0 bg-white px-3 text-base ring-1 ring-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-900 dark:ring-slate-700"
                  />
                </label>
              )}
              {timeText !== '' && customTime && parseMinutes(timeText, count) == null && (
                <Localized value={PYQ.timeTooShort} as="p" className="text-xs font-semibold text-rose-700 dark:text-rose-300" />
              )}
            </Section>

            <Section title={PYQ.difficultyLabel}>
              <div role="radiogroup" aria-label={PYQ.difficultyLabel.en} className="grid gap-2 sm:grid-cols-2">
                {['mixed', 'easy', 'moderate', 'hard'].map((d) => {
                  const info = CT.difficulties[d];
                  const sel = difficulty === d;
                  return (
                    <button key={d} type="button" role="radio" aria-checked={sel} onClick={() => setDifficulty(d)} className={`rounded-xl p-3 text-left ring-1 ${sel ? 'bg-indigo-50 ring-2 ring-indigo-500 dark:bg-indigo-500/15' : 'bg-white ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:ring-slate-700'}`}>
                      <span className="flex items-center gap-1.5 text-sm font-bold text-slate-900 dark:text-white"><span aria-hidden="true">{info.icon}</span><Localized value={info.label} /></span>
                      <Localized value={info.hint} as="span" className="mt-0.5 block text-xs text-slate-600 dark:text-slate-300" />
                    </button>
                  );
                })}
              </div>
            </Section>

            <Section title={PYQ.yearLabel}>
              <div role="radiogroup" aria-label={PYQ.yearLabel.en} className="flex flex-wrap gap-2">
                <Choice selected={yearMode === 'all'} onClick={() => setYearMode('all')}><Localized value={PYQ.yearAll} /></Choice>
                <Choice selected={yearMode === 'recent'} onClick={() => setYearMode('recent')}><Localized value={PYQ.yearRecent} /></Choice>
                <Choice selected={yearMode === 'one'} onClick={() => { setYearMode('one'); setYear((y) => y ?? years[0] ?? null); }}><Localized value={PYQ.yearOne} /></Choice>
                <Choice selected={yearMode === 'range'} onClick={() => setYearMode('range')}><Localized value={PYQ.yearRange} /></Choice>
              </div>
              {yearMode === 'recent' && <Localized value={PYQ.yearRecentHint} as="p" className="text-xs text-slate-500 dark:text-slate-400" />}
              {yearMode === 'one' && (
                <label className="block max-w-xs">
                  <select
                    value={year ?? ''}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="mt-1 min-h-11 w-full rounded-xl border-0 bg-white px-3 text-base ring-1 ring-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-900 dark:ring-slate-700"
                  >
                    {years.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </label>
              )}
              {yearMode === 'range' && (
                <div className="flex max-w-md flex-wrap gap-2">
                  <label className="min-w-32 flex-1">
                    <Localized value={PYQ.yearFrom} as="span" className="text-xs font-semibold text-slate-600 dark:text-slate-300" />
                    <input type="number" inputMode="numeric" min={1990} max={2100} value={yearFrom} onChange={(e) => setYearFrom(e.target.value)} placeholder="2019" className="mt-1 min-h-11 w-full rounded-xl border-0 bg-white px-3 text-base ring-1 ring-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-900 dark:ring-slate-700" />
                  </label>
                  <label className="min-w-32 flex-1">
                    <Localized value={PYQ.yearTo} as="span" className="text-xs font-semibold text-slate-600 dark:text-slate-300" />
                    <input type="number" inputMode="numeric" min={1990} max={2100} value={yearTo} onChange={(e) => setYearTo(e.target.value)} placeholder="2024" className="mt-1 min-h-11 w-full rounded-xl border-0 bg-white px-3 text-base ring-1 ring-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-900 dark:ring-slate-700" />
                  </label>
                </div>
              )}
              {yearMode === 'range' && !rangeValid && (
                <Localized value={PYQ.yearRangeInvalid} as="p" className="text-xs font-semibold text-rose-700 dark:text-rose-300" />
              )}
            </Section>

            <Section title={PYQ.repeatLabel}>
              <div role="radiogroup" aria-label={PYQ.repeatLabel.en} className="grid gap-2 sm:grid-cols-2">
                {PYQ_REPEAT_MODES.map((m) => {
                  const info = PYQ.repeatModes[m];
                  const sel = repeat === m;
                  return (
                    <button key={m} type="button" role="radio" aria-checked={sel} onClick={() => setRepeat(m)} className={`rounded-xl p-3 text-left ring-1 ${sel ? 'bg-indigo-50 ring-2 ring-indigo-500 dark:bg-indigo-500/15' : 'bg-white ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:ring-slate-700'}`}>
                      <Localized value={info.label} as="span" className="block text-sm font-bold text-slate-900 dark:text-white" />
                      <Localized value={info.hint} as="span" className="mt-0.5 block text-xs text-slate-600 dark:text-slate-300" />
                    </button>
                  );
                })}
              </div>
            </Section>

            <section aria-live="polite" className="rounded-2xl bg-white p-4 ring-1 ring-indigo-200 dark:bg-slate-900 dark:ring-indigo-500/30">
              {needsSignIn ? (
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  <Localized value={PYQ.signInForPyq} /> —{' '}
                  <Link to={loginPath(location)} className="font-semibold text-indigo-700 underline underline-offset-2 dark:text-indigo-300">
                    <Localized value={CT.signInToUse} />
                  </Link>
                </p>
              ) : previewError ? (
                <p role="alert" className="text-sm font-semibold text-rose-700 dark:text-rose-300">{previewError.message ?? 'Could not count matching PYQs.'}</p>
              ) : preview == null ? (
                <Localized value={PYQ.loadingPreview} as="p" className="text-sm text-slate-500 dark:text-slate-400" />
              ) : (
                <>
                  <Localized value={PYQ.availableNow(available)} as="p" className="text-sm font-bold text-slate-900 dark:text-white" />
                  {shortBy > 0 && available >= 5 && <Localized value={PYQ.onlyAvailable(available, count)} as="p" className="mt-1 text-sm text-amber-800 dark:text-amber-200" />}
                  {available < 5 && <Localized value={PYQ.tooFew(available)} as="p" className="mt-1 text-sm font-semibold text-rose-700 dark:text-rose-300" />}
                  <Localized value={PYQ.markingWhy} as="p" className="mt-2 text-xs text-slate-500 dark:text-slate-400" />
                </>
              )}
            </section>

            {errorText && !needsSignIn && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-800 dark:bg-rose-500/10 dark:text-rose-200"><Localized value={errorText} /></p>}
          </div>

          <footer className="flex flex-wrap items-center gap-2 border-t border-slate-200 bg-white px-4 py-3 sm:px-6 dark:border-slate-800 dark:bg-slate-900">
            <button type="button" onClick={onClose} className={`${chip} ${off}`}><Localized value={CT.close} /></button>
            <div className="ml-auto">
              <button type="button" onClick={begin} disabled={!canStart} className={`${chip} bg-emerald-600 px-5 text-white ring-emerald-600 hover:bg-emerald-500 disabled:opacity-60`}>
                <Localized value={busy ? PYQ.startingTest : startLabel} />
              </button>
            </div>
          </footer>
        </div>
      )}
    </dialog>
  );
}
