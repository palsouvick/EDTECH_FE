import { useEffect, useMemo, useRef, useState } from 'react';
import { useDataSource } from '../../app/DataSourceContext';
import { useLanguagePreference } from '../../hooks/useLanguagePreference';
import { CT, reasonText } from '../../lib/customTestCopy';
import { COUNT_CHOICES, DEFAULTS, TIME_CHOICES, buildRequest, defaultCount, parseCount, pctBand, smartMinutes } from '../../lib/customTest';
import { Localized } from '../topic-hub/Localized';
import { useStartCustomTest } from './useStartCustomTest';

const STEPS = 3;
const chip = 'inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-3 text-sm font-semibold ring-1 transition-colors focus-visible:outline-2 focus-visible:outline-indigo-500';
const on = 'bg-indigo-600 text-white ring-indigo-600';
const off = 'bg-white text-slate-700 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-700 dark:hover:bg-slate-800';
const BAND_STYLE = {
  strong: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300',
  practice: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
  weak: 'bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300',
};

function Section({ title, children }) {
  return (
    <section className="space-y-2">
      <Localized value={title} as="h3" className="text-sm font-bold text-slate-900 dark:text-white" />
      {children}
    </section>
  );
}

function Choice({ selected, onClick, children, className = '', ...rest }) {
  return (
    <button type="button" role="radio" aria-checked={selected} onClick={onClick} className={`${chip} ${selected ? on : off} ${className}`} {...rest}>
      {children}
    </button>
  );
}

function ChapterChip({ c, checked, onToggle }) {
  const none = !c.available?.total;
  const band = pctBand(c.accuracyPct);
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={none}
      onClick={onToggle}
      className={`flex w-full items-start gap-2 rounded-xl p-2.5 text-left text-sm ring-1 transition-colors focus-visible:outline-2 focus-visible:outline-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? 'bg-indigo-50 ring-2 ring-indigo-500 dark:bg-indigo-500/15' : 'bg-white ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:ring-slate-700 dark:hover:bg-slate-800'
      }`}
    >
      <span aria-hidden="true" className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-md text-xs font-bold ${checked ? 'bg-indigo-600 text-white' : 'ring-1 ring-slate-300 dark:ring-slate-600'}`}>
        {checked ? '✓' : ''}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white">
          <span aria-hidden="true">{c.emoji}</span>
          <Localized value={c.title} className="truncate" />
        </span>
        <span className="mt-1 flex flex-wrap gap-1 text-xs">
          <Localized value={none ? CT.noQuestions : CT.nQuestionsAvail(c.available.total)} className="text-slate-500 dark:text-slate-400" />
          {band && <Localized value={CT.accuracy(c.accuracyPct)} className={`rounded-full px-1.5 font-bold ${BAND_STYLE[band]}`} />}
          {c.mistakes > 0 && <Localized value={CT.mistakesN(c.mistakes)} className="rounded-full bg-rose-50 px-1.5 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300" />}
        </span>
      </span>
    </button>
  );
}

function PresetCard({ title, hint, onClick, disabled, tone }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-xl p-3 text-left ring-1 transition-colors focus-visible:outline-2 focus-visible:outline-indigo-500 disabled:cursor-not-allowed disabled:opacity-55 ${tone}`}
    >
      <Localized value={title} as="span" className="block text-sm font-bold" />
      <Localized value={hint} as="span" className="mt-0.5 block text-xs opacity-80" />
    </button>
  );
}

const initialState = (initial, chapters) => {
  const topics = new Set(initial.topics || []);
  return {
    preset: initial.preset ?? 'custom',
    topics,
    count: initial.count ?? defaultCount(topics.size || chapters),
    countText: '',
    customCount: false,
    countTouched: Boolean(initial.count),
    difficulty: initial.difficulty ?? DEFAULTS.difficulty,
    distribution: DEFAULTS.distribution,
    mode: initial.mode ?? DEFAULTS.mode,
    time: DEFAULTS.time,
  };
};

/**
 * The custom chapter test popup: 1 chapters (or a shortcut: weak topics, mistakes, Quick 10,
 * Challenge me) -> 2 questions + difficulty + distribution -> 3 time + mode, with the final
 * summary and the server's split. Smart defaults mean Start works from step 1.
 * @param {{ open: boolean, onClose: () => void, subject: 'quant'|'english'|'gs', initial?: object }} props
 */
export default function CustomTestDialog({ open, onClose, subject, initial = {} }) {
  const source = useDataSource();
  const { lang } = useLanguagePreference();
  const start = useStartCustomTest();
  const ref = useRef(null);
  const [options, setOptions] = useState({ status: 'loading' });
  const [step, setStep] = useState(initial.step ?? 1);
  const [s, setS] = useState(() => initialState(initial, 0));
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal?.();
    if (!open && el.open) el.close?.();
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    let live = true;
    setOptions({ status: 'loading' });
    source.getCustomTestOptions(subject, lang).then(
      (data) => live && setOptions({ status: 'ready', data }),
      (err) => live && setOptions({ status: 'error', error: err }),
    );
    return () => {
      live = false;
    };
  }, [open, source, subject, lang]);

  const data = options.data;
  const chapters = useMemo(() => data?.chapters ?? [], [data]);
  const names = useMemo(() => new Map(chapters.map((c) => [c.topic, c.title])), [chapters]);
  const selected = chapters.filter((c) => s.topics.has(c.topic));
  const count = s.preset === 'quick10' ? 10 : s.count;
  const recommended = preview?.recommendedMinutes ?? smartMinutes(data?.secondsPerQuestion, s.difficulty, count);
  const body = buildRequest(subject, s, lang);

  // The server's split (and the questions really available) for the summary, refreshed as settings change.
  const bodyKey = JSON.stringify(body);
  useEffect(() => {
    if (!open || step !== STEPS || options.status !== 'ready') return undefined;
    let live = true;
    setPreview(null);
    const id = setTimeout(() => {
      source.previewCustomTest(JSON.parse(bodyKey)).then(
        (p) => live && (setPreview(p), setError(null)),
        (err) => live && setError(err),
      );
    }, 250);
    return () => {
      live = false;
      clearTimeout(id);
    };
  }, [open, step, bodyKey, source, options.status]);

  const update = (patch) => setS((x) => ({ ...x, ...patch }));
  const toggle = (topic) =>
    setS((x) => {
      const topics = new Set(x.topics);
      if (topics.has(topic)) topics.delete(topic);
      else topics.add(topic);
      const preset = x.preset === 'weak' || x.preset === 'mistakes' ? 'custom' : x.preset;
      return { ...x, topics, preset, count: x.countTouched ? x.count : defaultCount(topics.size) };
    });
  const setAll = (all) => setS((x) => {
    const topics = new Set(all ? chapters.filter((c) => c.available?.total).map((c) => c.topic) : []);
    return { ...x, topics, preset: 'custom', count: x.countTouched ? x.count : defaultCount(topics.size) };
  });

  const usePreset = (preset) => {
    setError(null);
    if (preset === 'weak') update({ preset, topics: new Set(data.weakTopics), distribution: 'smart' });
    if (preset === 'mistakes') {
      const withMistakes = chapters.filter((c) => c.mistakes > 0).map((c) => c.topic);
      const pick = s.topics.size ? withMistakes.filter((t) => s.topics.has(t)) : withMistakes;
      update({ preset, topics: new Set(pick.length ? pick : withMistakes) });
    }
    if (preset === 'quick10') update({ preset, difficulty: 'mixed', time: 'smart' });
    if (preset === 'challenge') update({ preset, difficulty: 'hard' });
    setStep(STEPS);
  };

  const begin = async () => {
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
  const canStart = s.topics.size > 0 && (!s.customCount || parseCount(s.countText) != null) && !busy;
  const diffLabel = CT.difficulties[s.difficulty].label;
  const hasMistakes = (data?.mistakesTotal ?? 0) > 0;

  return (
    <dialog
      ref={ref}
      aria-labelledby="ct-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => e.target === ref.current && onClose()}
      className="m-auto max-h-[94dvh] w-[min(46rem,calc(100vw-1rem))] overflow-hidden rounded-2xl bg-slate-50 p-0 text-slate-800 shadow-2xl backdrop:bg-slate-950/50 backdrop:backdrop-blur-sm dark:bg-slate-950 dark:text-slate-100"
    >
      {open && (
        <div className="flex max-h-[94dvh] flex-col">
          <header className="border-b border-slate-200 bg-white px-4 py-3 sm:px-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 id="ct-title" className="text-lg font-extrabold text-slate-900 dark:text-white"><Localized value={CT.title} /></h2>
                <p className="mt-0.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                  <Localized value={CT.stepOf(step, STEPS)} /> · <Localized value={CT.steps[step - 1]} />
                </p>
              </div>
              <button type="button" onClick={onClose} className="grid size-11 shrink-0 place-items-center rounded-xl text-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label={CT.close[lang] ?? CT.close.en}>
                ✕
              </button>
            </div>
            <ol className="mt-3 grid grid-cols-3 gap-1.5" aria-hidden="true">
              {CT.steps.map((label, i) => (
                <li key={label.en} className={`h-1.5 rounded-full ${i < step ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'}`} />
              ))}
            </ol>
          </header>

          <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4 sm:px-6">
            {options.status === 'loading' && <p aria-busy="true" className="h-40 animate-pulse rounded-xl bg-slate-200/60 p-4 text-sm text-slate-500 motion-reduce:animate-none dark:bg-slate-800"><Localized value={CT.loading} /></p>}
            {options.status === 'error' && <p role="alert" className="rounded-xl bg-rose-50 p-4 text-sm text-rose-800 dark:bg-rose-500/10 dark:text-rose-200">{options.error?.message}</p>}

            {options.status === 'ready' && step === 1 && (
              <>
                <Section title={CT.selectChapters}>
                  <div className="flex flex-wrap items-center gap-2">
                    <button type="button" onClick={() => setAll(true)} className={`${chip} ${off}`}><Localized value={CT.selectAll} /></button>
                    <button type="button" onClick={() => setAll(false)} disabled={!s.topics.size} className={`${chip} ${off} disabled:opacity-50`}><Localized value={CT.clearAll} /></button>
                    <p aria-live="polite" className="text-sm font-semibold text-slate-600 dark:text-slate-300"><Localized value={s.topics.size ? CT.nSelected(s.topics.size) : CT.noneSelected} /></p>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {chapters.map((c) => <ChapterChip key={c.topic} c={c} checked={s.topics.has(c.topic)} onToggle={() => toggle(c.topic)} />)}
                  </div>
                </Section>
                {selected.length > 0 && (
                  <div className="rounded-xl bg-white p-3 ring-1 ring-indigo-200 dark:bg-slate-900 dark:ring-indigo-500/30">
                    <Localized value={CT.selectedTopics} as="p" className="text-xs font-bold uppercase tracking-wide text-indigo-700 dark:text-indigo-300" />
                    <ul className="mt-1 flex flex-wrap gap-1.5 text-sm">
                      {selected.map((c) => <li key={c.topic} className="rounded-full bg-indigo-50 px-2.5 py-1 font-semibold text-indigo-900 dark:bg-indigo-500/15 dark:text-indigo-100"><Localized value={c.title} /></li>)}
                    </ul>
                  </div>
                )}
                <Section title={CT.shortcuts}>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <PresetCard
                      title={CT.weakPreset}
                      hint={data.weakTopics.length ? CT.weakPresetHint(data.weakTopics.map((t) => names.get(t)?.[lang] ?? names.get(t)?.en ?? t).join(', ')) : CT.weakPresetNone}
                      disabled={!data.weakTopics.length}
                      onClick={() => usePreset('weak')}
                      tone="bg-rose-50 text-rose-900 ring-rose-200 hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-100 dark:ring-rose-500/30"
                    />
                    <PresetCard
                      title={CT.mistakesPreset}
                      hint={hasMistakes ? CT.mistakesPresetHint(data.mistakesTotal) : CT.mistakesPresetNone}
                      disabled={!hasMistakes}
                      onClick={() => usePreset('mistakes')}
                      tone="bg-orange-50 text-orange-900 ring-orange-200 hover:bg-orange-100 dark:bg-orange-500/10 dark:text-orange-100 dark:ring-orange-500/30"
                    />
                    <PresetCard
                      title={CT.quickPreset}
                      hint={s.topics.size ? CT.quickPresetHint : CT.noneSelected}
                      disabled={!s.topics.size}
                      onClick={() => usePreset('quick10')}
                      tone="bg-sky-50 text-sky-900 ring-sky-200 hover:bg-sky-100 dark:bg-sky-500/10 dark:text-sky-100 dark:ring-sky-500/30"
                    />
                    {data.history?.challengeUnlocked && (
                      <PresetCard
                        title={CT.challengePreset}
                        hint={s.topics.size ? CT.challengeHint : CT.noneSelected}
                        disabled={!s.topics.size}
                        onClick={() => usePreset('challenge')}
                        tone="bg-fuchsia-50 text-fuchsia-900 ring-fuchsia-200 hover:bg-fuchsia-100 dark:bg-fuchsia-500/10 dark:text-fuchsia-100 dark:ring-fuchsia-500/30"
                      />
                    )}
                  </div>
                </Section>
              </>
            )}

            {options.status === 'ready' && step === 2 && (
              <>
                <Section title={CT.howMany}>
                  <div role="radiogroup" aria-label={CT.howMany.en} className="flex flex-wrap gap-2">
                    {COUNT_CHOICES.map((n) => (
                      <Choice key={n} selected={!s.customCount && s.count === n && s.preset !== 'quick10'} onClick={() => update({ count: n, customCount: false, countTouched: true, preset: s.preset === 'quick10' ? 'custom' : s.preset })}>
                        {n}
                      </Choice>
                    ))}
                    <Choice selected={s.customCount} onClick={() => update({ customCount: true, countTouched: true, preset: s.preset === 'quick10' ? 'custom' : s.preset })}>
                      <Localized value={CT.custom} />
                    </Choice>
                  </div>
                  {s.customCount && (
                    <label className="block max-w-xs">
                      <Localized value={CT.customCountLabel} as="span" className="text-xs font-semibold text-slate-600 dark:text-slate-300" />
                      <input
                        type="number"
                        inputMode="numeric"
                        min={5}
                        max={100}
                        value={s.countText}
                        onChange={(e) => {
                          const n = parseCount(e.target.value);
                          update({ countText: e.target.value, ...(n != null && { count: n }) });
                        }}
                        aria-invalid={s.countText !== '' && parseCount(s.countText) == null}
                        className="mt-1 min-h-11 w-full rounded-xl border-0 bg-white px-3 text-base ring-1 ring-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-900 dark:ring-slate-700"
                      />
                    </label>
                  )}
                </Section>
                <Section title={CT.difficulty}>
                  <div role="radiogroup" aria-label={CT.difficulty.en} className="grid gap-2 sm:grid-cols-2">
                    {['exam', 'mixed', 'easy', 'moderate', 'hard'].map((d) => {
                      const info = CT.difficulties[d];
                      const sel = s.difficulty === d;
                      return (
                        <button key={d} type="button" role="radio" aria-checked={sel} onClick={() => update({ difficulty: d, preset: s.preset === 'challenge' && d !== 'hard' ? 'custom' : s.preset })} className={`rounded-xl p-3 text-left ring-1 ${sel ? 'bg-indigo-50 ring-2 ring-indigo-500 dark:bg-indigo-500/15' : 'bg-white ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:ring-slate-700'}`}>
                          <span className="flex items-center gap-1.5 text-sm font-bold text-slate-900 dark:text-white"><span aria-hidden="true">{info.icon}</span><Localized value={info.label} /></span>
                          <Localized value={info.hint} as="span" className="mt-0.5 block text-xs text-slate-600 dark:text-slate-300" />
                        </button>
                      );
                    })}
                  </div>
                </Section>
                {s.topics.size > 1 && s.preset !== 'mistakes' && (
                  <Section title={CT.distribution}>
                    <div role="radiogroup" aria-label={CT.distribution.en} className="grid gap-2 sm:grid-cols-2">
                      {['smart', 'balanced'].map((d) => (
                        <button key={d} type="button" role="radio" aria-checked={s.distribution === d} onClick={() => update({ distribution: d })} className={`rounded-xl p-3 text-left ring-1 ${s.distribution === d ? 'bg-indigo-50 ring-2 ring-indigo-500 dark:bg-indigo-500/15' : 'bg-white ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:ring-slate-700'}`}>
                          <Localized value={CT.distributions[d].label} as="span" className="block text-sm font-bold text-slate-900 dark:text-white" />
                          <Localized value={CT.distributions[d].hint} as="span" className="mt-0.5 block text-xs text-slate-600 dark:text-slate-300" />
                        </button>
                      ))}
                    </div>
                  </Section>
                )}
              </>
            )}

            {options.status === 'ready' && step === 3 && (
              <>
                <Section title={CT.mode}>
                  <div role="radiogroup" aria-label={CT.mode.en} className="grid gap-2 sm:grid-cols-2">
                    {['exam', 'practice'].map((m) => {
                      const info = CT.modes[m];
                      return (
                        <button key={m} type="button" role="radio" aria-checked={s.mode === m} onClick={() => update({ mode: m })} className={`rounded-xl p-3 text-left ring-1 ${s.mode === m ? 'bg-indigo-50 ring-2 ring-indigo-500 dark:bg-indigo-500/15' : 'bg-white ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:ring-slate-700'}`}>
                          <span className="flex items-center gap-1.5 text-sm font-bold text-slate-900 dark:text-white"><span aria-hidden="true">{info.icon}</span><Localized value={info.label} /></span>
                          <Localized value={info.hint} as="span" className="mt-0.5 block text-xs text-slate-600 dark:text-slate-300" />
                        </button>
                      );
                    })}
                  </div>
                </Section>
                <Section title={CT.time}>
                  <div role="radiogroup" aria-label={CT.time.en} className="flex flex-wrap gap-2">
                    <Choice selected={s.time === 'smart'} onClick={() => update({ time: 'smart' })}><Localized value={CT.smartTime(recommended)} /></Choice>
                    {TIME_CHOICES.map((m) => (
                      <Choice key={m} selected={s.time === m} onClick={() => update({ time: m })} disabled={m * 60 < count * 10}>
                        <span aria-hidden="true">⏱</span> <Localized value={CT.minutes(m)} />
                      </Choice>
                    ))}
                  </div>
                  <Localized value={CT.smartTimeHint(preview?.questionCount ?? count, (diffLabel[lang] ?? diffLabel.en).toLowerCase(), recommended)} as="p" className="text-xs text-slate-500 dark:text-slate-400" />
                  {s.mode === 'practice' && <Localized value={CT.untimedPractice} as="p" className="text-xs text-slate-500 dark:text-slate-400" />}
                </Section>

                <section aria-labelledby="ct-summary" className="rounded-2xl bg-white p-4 ring-1 ring-indigo-200 dark:bg-slate-900 dark:ring-indigo-500/30">
                  <h3 id="ct-summary" className="text-base font-extrabold text-slate-900 dark:text-white"><Localized value={CT.yourTest} /></h3>
                  <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
                    <Localized value={CT.subject} as="dt" className="font-semibold text-slate-500" />
                    <dd><Localized value={CT.subjects[subject]} /> · <Localized value={CT.presetNames[s.preset]} /></dd>
                    <Localized value={CT.chapters} as="dt" className="font-semibold text-slate-500" />
                    <dd>{selected.map((c, i) => <span key={c.topic}>{i > 0 && ', '}<Localized value={c.title} /></span>)}</dd>
                    <Localized value={CT.questions} as="dt" className="font-semibold text-slate-500" />
                    <dd className="tabular-nums">{preview?.questionCount ?? count}</dd>
                    <Localized value={CT.difficulty} as="dt" className="font-semibold text-slate-500" />
                    <dd>{CT.difficulties[s.difficulty].icon} <Localized value={diffLabel} /></dd>
                    <Localized value={CT.modeLabel} as="dt" className="font-semibold text-slate-500" />
                    <dd>{CT.modes[s.mode].icon} <Localized value={CT.modes[s.mode].label} /></dd>
                    <Localized value={CT.timeLabel} as="dt" className="font-semibold text-slate-500" />
                    <dd><Localized value={CT.minutes(s.time === 'smart' ? recommended : s.time)} /></dd>
                    {s.topics.size > 1 && (
                      <>
                        <Localized value={CT.distributionLabel} as="dt" className="font-semibold text-slate-500" />
                        <dd><Localized value={s.preset === 'mistakes' ? CT.mistakesPreset : CT.distributions[s.distribution].label} /></dd>
                      </>
                    )}
                  </dl>
                  {preview?.shortBy > 0 && <p role="status" className="mt-3 rounded-lg bg-amber-50 p-2 text-xs font-semibold text-amber-900 dark:bg-amber-500/10 dark:text-amber-200"><Localized value={CT.shortBy(preview.questionCount, preview.requested)} /></p>}
                  {preview && preview.plan.length > 1 && (
                    <div className="mt-3">
                      <Localized value={CT.whyThisSplit} as="p" className="text-xs font-bold uppercase tracking-wide text-slate-500" />
                      <ul className="mt-1 space-y-1 text-sm">
                        {preview.plan.map((p) => (
                          <li key={p.topic} className="flex flex-wrap items-baseline gap-x-2">
                            <span className="font-semibold"><Localized value={names.get(p.topic) ?? { en: p.topic }} /> → <span className="tabular-nums">{p.count}</span></span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {p.reasons.map(reasonText).filter(Boolean).map((r, i) => <span key={i}>{i > 0 && ' · '}<Localized value={r} /></span>)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </section>
              </>
            )}

            {errorText && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-800 dark:bg-rose-500/10 dark:text-rose-200"><Localized value={errorText} /></p>}
          </div>

          <footer className="flex flex-wrap items-center gap-2 border-t border-slate-200 bg-white px-4 py-3 sm:px-6 dark:border-slate-800 dark:bg-slate-900">
            {step > 1 && (
              <button type="button" onClick={() => setStep(step - 1)} className={`${chip} ${off}`}><Localized value={CT.back} /></button>
            )}
            {step === 1 && (
              <button type="button" onClick={begin} disabled={!canStart} className={`${chip} ${off} disabled:opacity-50`}>
                <Localized value={CT.quickStart} />
              </button>
            )}
            <div className="ml-auto flex gap-2">
              {step < STEPS && (
                <button type="button" onClick={() => setStep(step + 1)} disabled={!s.topics.size} className={`${chip} bg-slate-900 text-white ring-slate-900 disabled:opacity-50 dark:bg-white dark:text-slate-900`}>
                  <Localized value={CT.next} /> →
                </button>
              )}
              {step === STEPS && (
                <button type="button" onClick={begin} disabled={!canStart} className={`${chip} bg-emerald-600 px-5 text-white ring-emerald-600 hover:bg-emerald-500 disabled:opacity-60`}>
                  <Localized value={busy ? CT.starting : CT.start} />
                </button>
              )}
            </div>
          </footer>
        </div>
      )}
    </dialog>
  );
}
